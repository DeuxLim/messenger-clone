import { useState, useEffect, useCallback, useMemo } from "react";
import ChatContext from "./ChatContext.js";
import { isEmpty } from "../../utilities/utils.js";
import useAuth from "../auth/useAuth.js";
import useSocket from "../socket/useSocket.js";
import { loadChatOverview } from "../../services/chats.service.js";
import useChatSearch from "./ChatSearch/useChatSearch.js";

export default function ChatProvider({ children }) {
    const { token, currentUser } = useAuth();
    const { socket } = useSocket();
    const chatSearch = useChatSearch();
    const isSearch = chatSearch?.isSearch ?? false;
    const isReady = Boolean(token && socket);

    // ---- Chat States ----
    const [activeChatData, setActiveChatData] = useState(null);
    const [activeChatMessages, setActiveChatMessages] = useState([]);
    const [selectedMediaAttachments, setSelectedMediaAttachments] = useState([]);
    const [chatItems, setChatItems] = useState([]);
    const [userItems, setUserItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Consolidated user and chats list for sidebar
    const usersAndChatsList = useMemo(() => {
        const chats = (chatItems || []).map(c => ({ ...c, type: "chat" }));
        const users = (userItems || []).map(u => ({ ...u, type: "user" }));
        return [...chats, ...users];
    }, [chatItems, userItems]);

    const createEmptyTempChat = (participants = []) => {
        return {
            _id: null,
            chatName: null,
            chatPhoto: null,
            admins: [],
            nicknames: {},
            lastMessage: null,
            mutedBy: [],
            archivedBy: [],
            deletedFor: [],
            updatedBy: null,
            unreadCount: 0,
            isGroup: participants.length > 2,
            participants,
            type: "temp",
            clientTempChatId: `temp-chat-${crypto.randomUUID()}`,
        };
    };

    const normalizeChat = (data, currentUser) => {
        if (isEmpty(data)) return null;

        const baseChat = {
            _id: data._id ?? null,
            chatName: null,
            chatPhoto: null,
            admins: [],
            nicknames: {},
            lastMessage: null,
            mutedBy: [],
            archivedBy: [],
            deletedFor: [],
            updatedBy: null,
            unreadCount: 0,
        };

        if (data.type === "user") {
            return {
                ...baseChat,
                isGroup: false,
                participants: [data, currentUser],
                type: "temp",
                clientTempChatId: `temp-chat-${crypto.randomUUID()}`
            };
        }

        if (data.type === "temp") {
            return {
                ...baseChat,
                ...data,
                isGroup: data.participants?.length > 2,
                type: "temp",
                clientTempChatId: `temp-chat-${crypto.randomUUID()}`
            };
        }

        if (!data._id) {
            throw new Error("Invalid chat: chat must have an _id");
        }

        return {
            ...baseChat,
            ...data,
            isGroup: !!data.isGroup,
            type: "chat",
        };
    };


    // ---- Select Chat ----
    const setNormalizedActiveChat = useCallback((data) => {
        const normalized = normalizeChat(data, currentUser);
        if (!normalized) return;

        setActiveChatData(normalized);
    }, [currentUser]);

    const clearActiveChat = useCallback(() => {
        setActiveChatData(null);
    }, [setActiveChatData]);

    const clearActiveChatMessages = useCallback(() => {
        setActiveChatMessages([]);
    }, [setActiveChatMessages]);

    const addOptimisticMessage = (message, targetChat) => {
        if (!targetChat) return;

        // 1️⃣ Append optimistic message.
        setActiveChatMessages(prev => [...prev, message]);

        // 2️⃣ Update ActiveChatData's last message data.
        setActiveChatData(prev => {
            if (!prev) return targetChat; // ✅ CRITICAL
            return { ...prev, lastMessage: message };
        });

        // 3️⃣ Update chat list + move chat to top
        setChatItems(prev => {
            const chatKey = targetChat.clientTempChatId ?? targetChat._id;

            const index = prev.findIndex(
                chat => (chat.clientTempChatId ?? chat._id) === chatKey
            );

            // not found → prepend temp/new chat
            if (index === -1) {
                return [{ ...targetChat, lastMessage: message }, ...prev];
            }

            // update + move to top
            const updatedChat = {
                ...prev[index],
                lastMessage: message,
            };

            return [
                updatedChat,
                ...prev.slice(0, index),
                ...prev.slice(index + 1),
            ];
        });

        // 4️⃣ Remove messaged user from suggested list
        setUserItems((prev) => {
            if (!message?.sender?._id) return prev;

            return prev.filter(
                (user) => String(user?._id) !== String(message.sender._id)
            );
        });
    };

    // ---- Fetch Chats + Suggested Users ----
    useEffect(() => {
        if (!isReady || isSearch) return;

        const fetchChatData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const { chats, users } = await loadChatOverview();

                setChatItems(chats);
                setUserItems(users);
            } catch (err) {
                console.error("Error fetching chats:", err);
                setError("Failed to load chats. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        if (isEmpty(usersAndChatsList)) {
            fetchChatData();
        }
    }, [isReady, isSearch, usersAndChatsList]);

    // ---- Context Value ----
    const values = {
        // chat states
        activeChatData,
        activeChatMessages,
        addOptimisticMessage,
        setActiveChatMessages,
        setNormalizedActiveChat,
        normalizeChat,
        setActiveChatData,
        selectedMediaAttachments,
        setSelectedMediaAttachments,
        clearActiveChat,
        createEmptyTempChat,
        clearActiveChatMessages,

        // fetched lists
        chatItems,
        setChatItems,
        userItems,
        setUserItems,
        usersAndChatsList,

        // fetching status
        isLoading,
        error,
    };

    return (
        <ChatContext.Provider value={values}>
            {children}
        </ChatContext.Provider>
    );
}

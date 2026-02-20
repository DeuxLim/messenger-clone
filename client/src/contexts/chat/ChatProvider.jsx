import { useState, useCallback } from "react";
import ChatContext from "./ChatContext.js";
import { isEmpty } from "../../utilities/utils.js";
import useAuth from "../auth/useAuth.js";
import useChatData from "./ChatData/useChatData.js";

export default function ChatProvider({ children }) {
    const { currentUser } = useAuth();
    const chatData = useChatData();

    // ---- Chat States ----
    const [activeChatData, setActiveChatData] = useState(null);
    const [activeChatMessages, setActiveChatMessages] = useState([]);
    const [selectedMediaAttachments, setSelectedMediaAttachments] = useState([]);

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

    const {
        chatItems,
        setChatItems,
        userItems,
        setUserItems,
        usersAndChatsList,
        isLoading,
        error,
    } = chatData || {};

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

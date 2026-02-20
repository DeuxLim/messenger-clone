import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import ChatContext from "./ChatContext.js";
import { isEmpty } from "../../utilities/utils.js";
import useAuth from "../auth/useAuth.js";
import useSocket from "../socket/useSocket.js";
import { loadChatOverview } from "../../services/chats.service.js";

export default function ChatProvider({ children }) {
    const { token, currentUser } = useAuth();
    const { socket, socketStatus } = useSocket();
    const isReady = Boolean(token && socket);

    // ---- Chat States ----
    const [activeChatData, setActiveChatData] = useState(null);
    const [activeChatMessages, setActiveChatMessages] = useState([]);
    const [selectedMediaAttachments, setSelectedMediaAttachments] = useState([]);
    const [chatItems, setChatItems] = useState([]);
    const [userItems, setUserItems] = useState([]);
    const [isSearch, setIsSearch] = useState(false);
    const [searchResults, setSearchResults] = useState({ chats: [], users: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const updateChatSearchResults = useCallback(
        ({ chats = [], users = [], isSearch = false }) => {
            const searchChatsList = (chats || []).map(c => ({ ...c, type: "chat" }));
            const searchUsersList = (users || []).map(u => ({ ...u, type: "user" }));
            setSearchResults([...searchChatsList, ...searchUsersList]);
            setIsSearch(isSearch);
        },
        []
    );

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

    // ---- Socket Presence ----
    useEffect(() => {
        if (!socket || socketStatus !== "connected") return;

        // 1. append to activeChatMessages
        // 2. update activeChatData.lastMessage
        // 3. update chatItems (move chat to top, update preview)
        // 4. remove messaged user from suggested list
        socket.on("receiveMessage", ({ tempMessageId, message }) => {
            setActiveChatMessages((prev) => {
                const safePrev = Array.isArray(prev) ? prev : [];

                const activeChatId = activeChatDataRef.current?._id;
                if (!activeChatId || message?.chat?._id !== activeChatId) {
                    return safePrev;
                }

                // 1) Try replacing optimistic message (sender case)
                if (tempMessageId) {
                    let replaced = false;

                    const updated = safePrev.map((m) => {
                        if (m._id === tempMessageId) {
                            replaced = true;
                            return { ...message, status: "sent" };
                        }
                        return m;
                    });

                    if (replaced) return updated;
                    // else → receiver path, fall through to append
                }

                // 2) Prevent duplicates
                const exists = safePrev.some((m) => m._id === message._id);
                if (exists) return safePrev;

                // 3) Append new message (receiver or fallback)
                return [...safePrev, message];
            });

            // --- Update active chat lastMessage ---
            setActiveChatData((prev) => {
                if (!prev || prev._id !== message?.chat?._id) return prev;
                return { ...prev, lastMessage: message };
            });

            // --- Update chat list + move chat to top ---
            setChatItems((prev) => {
                const exists = prev.some((chat) => chat?._id === message?.chat?._id);
                let updatedChats;

                if (exists) {
                    const updated = prev.map((chat) =>
                        chat?._id === message?.chat?._id ? { ...message.chat } : chat
                    );

                    const movedChat = updated.find(
                        (chat) => chat?._id === message?.chat?._id
                    );

                    updatedChats = [
                        movedChat,
                        ...updated.filter((chat) => chat?._id !== message?.chat?._id),
                    ];
                } else {
                    updatedChats = [message.chat, ...prev];
                }

                return updatedChats;
            });

            // --- Remove messaged user from suggested users ---
            setUserItems((prev) => {
                if (!message?.chat || !Array.isArray(message?.chat?.participants)) return prev;

                const otherUser = message.chat.participants.find(
                    (p) => String(p?._id) !== String(message.sender?._id)
                );

                if (!otherUser) return prev;

                return prev.filter(
                    (user) => String(user?._id) !== String(otherUser?._id)
                );
            });
        });

        return () => {
            socket.off("receiveMessage");
        };
    }, [socket, socketStatus]);

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

    /* ----- HANDLE MESSAGE SEEN STATUS ----  */
    const activeChatDataRef = useRef(activeChatData);
    useEffect(() => {
        activeChatDataRef.current = activeChatData;
    }, [activeChatData]);

    useEffect(() => {
        if (!socket || socketStatus !== "connected") return;

        const handleSeenUpdate = ({ chatId, seenMessages }) => {
            // Update chatItems (sidebar) - this should ALWAYS run
            setChatItems(prev =>
                prev.map(chat => {
                    if (chat._id === chatId && chat.lastMessage && seenMessages.includes(chat.lastMessage._id)) {
                        return { ...chat, lastMessage: { ...chat.lastMessage, isSeen: true } };
                    }
                    return chat;
                })
            );

            // Only update active chat messages if we're viewing this chat
            if (activeChatDataRef.current?._id === chatId) {
                setActiveChatMessages(prev =>
                    prev.map(message =>
                        seenMessages.includes(message._id)
                            ? { ...message, isSeen: true }
                            : message
                    )
                );
            }
        };

        socket.on("messages:seenUpdate", handleSeenUpdate);
        return () => socket.off("messages:seenUpdate", handleSeenUpdate);
    }, [socket, socketStatus]);
    /* ----- HANDLE MESSAGE SEEN STATUS ----  */

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
        searchResults,

        // presence + search
        isSearch,
        setIsSearch,
        updateChatSearchResults,

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

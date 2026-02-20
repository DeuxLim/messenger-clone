import { useCallback, useState } from "react";
import { isEmpty } from "../../../utilities/utils";
import useAuth from "../../auth/useAuth";
import useChatData from "../ChatData/useChatData";
import ChatSessionContext from "./ChatSessionContext";

export default function ChatSessionProvider({ children }) {
    const { currentUser } = useAuth();
    const { setChatItems, setUserItems } = useChatData() || {};

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

    const normalizeChat = (data, authUser) => {
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
                participants: [data, authUser],
                type: "temp",
                clientTempChatId: `temp-chat-${crypto.randomUUID()}`,
            };
        }

        if (data.type === "temp") {
            return {
                ...baseChat,
                ...data,
                isGroup: data.participants?.length > 2,
                type: "temp",
                clientTempChatId: `temp-chat-${crypto.randomUUID()}`,
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

    const setNormalizedActiveChat = useCallback(
        (data) => {
            const normalized = normalizeChat(data, currentUser);
            if (!normalized) return;
            setActiveChatData(normalized);
        },
        [currentUser],
    );

    const clearActiveChat = useCallback(() => {
        setActiveChatData(null);
    }, []);

    const clearActiveChatMessages = useCallback(() => {
        setActiveChatMessages([]);
    }, []);

    const addOptimisticMessage = (message, targetChat) => {
        if (!targetChat) return;

        setActiveChatMessages((prev) => [...prev, message]);

        setActiveChatData((prev) => {
            if (!prev) return targetChat;
            return { ...prev, lastMessage: message };
        });

        setChatItems?.((prev) => {
            const chatKey = targetChat.clientTempChatId ?? targetChat._id;
            const index = prev.findIndex(
                (chat) => (chat.clientTempChatId ?? chat._id) === chatKey,
            );

            if (index === -1) {
                return [{ ...targetChat, lastMessage: message }, ...prev];
            }

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

        setUserItems?.((prev) => {
            if (!message?.sender?._id) return prev;
            return prev.filter(
                (user) => String(user?._id) !== String(message.sender._id),
            );
        });
    };

    const data = {
        activeChatData,
        setActiveChatData,
        activeChatMessages,
        setActiveChatMessages,
        selectedMediaAttachments,
        setSelectedMediaAttachments,
        createEmptyTempChat,
        normalizeChat,
        setNormalizedActiveChat,
        clearActiveChat,
        clearActiveChatMessages,
        addOptimisticMessage,
    };

    return (
        <ChatSessionContext.Provider value={data}>
            {children}
        </ChatSessionContext.Provider>
    );
}

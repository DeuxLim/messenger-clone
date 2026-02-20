import { useEffect, useRef } from "react";
import useSocket from "../../socket/useSocket";
import useChatData from "../ChatData/useChatData";
import useChatSession from "../ChatSession/useChatSession";
import ChatRealtimeContext from "./ChatRealtimeContext";

export default function ChatRealtimeProvider({ children }) {
    const chatData = useChatData();
    const chatSession = useChatSession();
    const { socket, socketStatus } = useSocket();
    const activeChatDataRef = useRef(chatSession?.activeChatData);

    useEffect(() => {
        activeChatDataRef.current = chatSession?.activeChatData;
    }, [chatSession?.activeChatData]);

    useEffect(() => {
        if (!chatData || !chatSession || !socket || socketStatus !== "connected") return;

        const {
            setActiveChatMessages,
            setActiveChatData,
        } = chatSession;
        const { setChatItems, setUserItems } = chatData;

        const handleReceiveMessage = ({ tempMessageId, message }) => {
            setActiveChatMessages((prev) => {
                const safePrev = Array.isArray(prev) ? prev : [];

                const activeChatId = activeChatDataRef.current?._id;
                if (!activeChatId || message?.chat?._id !== activeChatId) {
                    return safePrev;
                }

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
                }

                const exists = safePrev.some((m) => m._id === message._id);
                if (exists) return safePrev;

                return [...safePrev, message];
            });

            setActiveChatData((prev) => {
                if (!prev || prev._id !== message?.chat?._id) return prev;
                return { ...prev, lastMessage: message };
            });

            setChatItems((prev) => {
                const exists = prev.some((item) => item?._id === message?.chat?._id);
                if (!exists) return [message.chat, ...prev];

                const updated = prev.map((item) =>
                    item?._id === message?.chat?._id ? { ...message.chat } : item,
                );

                const movedChat = updated.find(
                    (item) => item?._id === message?.chat?._id,
                );

                return [
                    movedChat,
                    ...updated.filter((item) => item?._id !== message?.chat?._id),
                ];
            });

            setUserItems((prev) => {
                if (!message?.chat || !Array.isArray(message.chat.participants)) return prev;

                const otherUser = message.chat.participants.find(
                    (p) => String(p?._id) !== String(message.sender?._id),
                );
                if (!otherUser) return prev;

                return prev.filter((user) => String(user?._id) !== String(otherUser?._id));
            });
        };

        socket.on("receiveMessage", handleReceiveMessage);
        return () => socket.off("receiveMessage", handleReceiveMessage);
    }, [chatData, chatSession, socket, socketStatus]);

    useEffect(() => {
        if (!chatData || !chatSession || !socket || socketStatus !== "connected") return;

        const { setChatItems } = chatData;
        const { setActiveChatMessages } = chatSession;

        const handleSeenUpdate = ({ chatId, seenMessages }) => {
            setChatItems((prev) =>
                prev.map((item) => {
                    if (
                        item._id === chatId &&
                        item.lastMessage &&
                        seenMessages.includes(item.lastMessage._id)
                    ) {
                        return {
                            ...item,
                            lastMessage: { ...item.lastMessage, isSeen: true },
                        };
                    }
                    return item;
                }),
            );

            if (activeChatDataRef.current?._id === chatId) {
                setActiveChatMessages((prev) =>
                    prev.map((message) =>
                        seenMessages.includes(message._id)
                            ? { ...message, isSeen: true }
                            : message,
                    ),
                );
            }
        };

        socket.on("messages:seenUpdate", handleSeenUpdate);
        return () => socket.off("messages:seenUpdate", handleSeenUpdate);
    }, [chatData, chatSession, socket, socketStatus]);

    return (
        <ChatRealtimeContext.Provider value={{}}>
            {children}
        </ChatRealtimeContext.Provider>
    );
}

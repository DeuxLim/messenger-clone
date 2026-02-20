import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import ChatMessage from "./ChatMessage";
import AvatarImage from "../global/AvatarImage";
import ChatDetailsPanel from "./ChatDetailsPanel";
import useAuth from "../../../contexts/auth/useAuth";
import useChatDisplay from "../../../contexts/chat/ChatDisplay/useChatDisplay";
import useSocket from "../../../contexts/socket/useSocket";
import { getChatMessages } from "../../../services/chats.service";
import useChatSession from "../../../contexts/chat/ChatSession/useChatSession";
import useSeenMessages from "../../../hooks/chat/useSeenMessages";
import useToast from "../../../contexts/ui/useToast";
import { getErrorMessage } from "../../../utilities/errors";

export default function ChatContent() {
    const { token, currentUser } = useAuth();
    const { setActiveChatMessages, activeChatMessages, activeChatData } = useChatSession();
    const { typingChats } = useChatDisplay();
    const { chatId } = useParams();
    const { socket } = useSocket();
    const toast = useToast();

    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

    const isTyping = !!typingChats?.[activeChatData?._id];
    const typingUserIds = typingChats?.[activeChatData?._id] || [];
    const typingUsers = activeChatData?.participants?.filter((p) => typingUserIds.includes(p._id)) || [];

    // Fetch chat messages
    useEffect(() => {
        if (!chatId || !token) return;

        let isMounted = true;

        const fetchMessages = async () => {
            try {
                setIsLoading(true);
                setError(false);
                setActiveChatMessages([]);

                const messages = await getChatMessages(chatId);

                if (!isMounted) return;
                setActiveChatMessages(messages);
            } catch (err) {
                if (isMounted) setError(true);
                toast.error(getErrorMessage(err, "Failed to load messages."));
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchMessages();

        return () => {
            isMounted = false;
        };
    }, [chatId, token, setActiveChatMessages, toast]);

    // Scroll to bottom when messages change
    useLayoutEffect(() => {
        if (!messagesEndRef.current) return;
        messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }, [activeChatMessages, isTyping]);

    useSeenMessages({
        socket,
        chatId,
        currentUserId: currentUser?._id,
        messages: activeChatMessages,
        rootRef: messagesContainerRef,
    });

    return (
        <section className="flex-1 overflow-y-auto hide-scrollbar mb-4 h-full">
            {error && <div>Something went wrong...</div>}

            <ChatDetailsPanel />

            <div className="p-3 flex flex-col gap-[2.5px] h-full" ref={messagesContainerRef}>
                {activeChatMessages?.map((m, index) => {
                    if (m.type === "system") {
                        return (
                            <div
                                key={m._id}
                                data-message-id={m._id}
                                className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4"
                            >
                                {m.text}
                            </div>
                        );
                    }

                    const prevMsg = activeChatMessages[index - 1];
                    const nextMsg = activeChatMessages[index + 1];
                    const lastMessageId =
                        typeof activeChatData?.lastMessage === "object"
                            ? activeChatData?.lastMessage?._id
                            : activeChatData?.lastMessage;

                    return (
                        <div key={m._id} data-message-id={m._id}>
                            <ChatMessage
                                data={m}
                                prevMsg={prevMsg}
                                nextMsg={nextMsg}
                                isLastMessage={m?._id === lastMessageId}
                                nicknames={activeChatData?.nicknames || {}}
                            />
                        </div>
                    );
                })}

                <div ref={messagesEndRef} />

                {typingUsers.map((user, index) => (
                    <div className="h-full flex justify-start items-end" key={index}>
                        <div className="flex text-sm mt-0.5">
                            <div className="flex gap-2 items-center max-w-[75%]">
                                <div className="w-7 h-7 flex-shrink-0 flex justify-center items-end">
                                    <div className="w-7 h-7 rounded-full overflow-hidden">
                                        <AvatarImage chatPhotoUrl={user?.profilePicture?.url} />
                                    </div>
                                </div>

                                <div className="px-3 py-1.5 bg-white dark:bg-gray-800 text-sm text-gray-400 dark:text-gray-300">
                                    typing...
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex items-center justify-center h-full">
                        <div className="size-8 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
                    </div>
                )}
            </div>
        </section>
    );
}

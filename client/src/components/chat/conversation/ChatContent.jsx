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

export default function ChatContent() {
    const { token, currentUser } = useAuth();
    const { setActiveChatMessages, activeChatMessages, activeChatData } = useChatSession();
    const { typingChats } = useChatDisplay();
    const { chatId } = useParams();
    const { socket } = useSocket();

    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const messagesEndRef = useRef(null);
    const isTyping = !!typingChats?.[activeChatData?._id];
    const typingUserIds = typingChats?.[activeChatData?._id] || [];
    const typingUsers = activeChatData?.participants?.filter((p) => typingUserIds.includes(p._id)) || [];
    const activeChatMessagesRef = useRef(activeChatMessages);

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
                console.error("Chat fetch error:", err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchMessages();

        return () => {
            isMounted = false;
        };
    }, [chatId, token, setActiveChatMessages]);

    // Scroll to bottom when messages change
    useLayoutEffect(() => {
        //if (isEmpty(activeChatMessages)) return;
        if (!messagesEndRef.current) return;
        messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }, [activeChatMessages, isTyping]);

    /* ----- HANDLE MESSAGE SEEN STATUS ----  */
    const observerRef = useRef(null);

    // Keep ref updated
    useEffect(() => {
        activeChatMessagesRef.current = activeChatMessages;
    }, [activeChatMessages]);

    // Set up observer once
    useEffect(() => {
        if (!socket || !currentUser?._id || !chatId) return;

        let seenTimeout;
        const observer = new IntersectionObserver(entries => {
            clearTimeout(seenTimeout);
            seenTimeout = setTimeout(() => {
                const visible = entries.filter(e => e.isIntersecting);
                const seenMessages = visible
                    .map(e => e.target.id.replace(/^msg-/, ""))
                    .filter(msgId => {
                        const msg = activeChatMessagesRef.current.find(m => m._id === msgId);
                        return msg && !msg.isSeen && msg.sender?._id !== currentUser._id;
                    });

                if (seenMessages.length) {
                    socket.emit("message:seen", {
                        chatId,
                        seenBy: currentUser._id,
                        seenMessages
                    });
                }
            }, 500);
        }, { threshold: 0.75 });

        observerRef.current = observer;

        // Observe existing messages
        const messageElements = document.querySelectorAll('[id^="msg-"]');
        messageElements.forEach(el => observer.observe(el));

        return () => {
            observer.disconnect();
            observerRef.current = null;
        };
    }, [socket, currentUser?._id, chatId]);

    // Observe new messages when activeChatMessages changes
    useEffect(() => {
        if (!observerRef.current) return;

        const messageElements = document.querySelectorAll('[id^="msg-"]');
        messageElements.forEach(el => {
            // Check if already being observed (observer will ignore duplicates anyway)
            observerRef.current.observe(el);
        });
    }, [activeChatMessages]);
    /* ----- HANDLE MESSAGE SEEN STATUS ----  */

    return (
        <section className="flex-1 overflow-y-auto hide-scrollbar mb-4 h-full">
            {error && <div>Something went wrong...</div>}

            <ChatDetailsPanel />

            <div className="p-3 flex flex-col gap-[2.5px] h-full">
                {activeChatMessages?.map((m) => {
                    // SYSTEM MESSAGE — NO sender access allowed
                    if (m.type === "system") {
                        return (
                            <div
                                id={`msg-${m._id}`}
                                key={m._id}
                                className="text-center text-xs text-gray-500 mt-4"
                            >
                                {m.text}
                            </div>
                        );
                    }

                    // USER MESSAGE — sender is guaranteed
                    return (
                        <ChatMessage
                            key={m._id}
                            data={m}
                        />
                    );
                })}
                <div ref={messagesEndRef} />

                {
                    typingUsers.map((user, index) => (
                        <div className="h-full flex justify-start items-end" key={index}>
                            <div className="flex text-sm mt-0.5">
                                <div className="flex gap-2 items-center max-w-[75%]">
                                    <div className="w-7 h-7 flex-shrink-0 flex justify-center items-end">
                                        <div className="w-7 h-7 rounded-full overflow-hidden">
                                            <AvatarImage chatPhotoUrl={user?.profilePicture?.url} />
                                        </div>
                                    </div>

                                    <div className="px-3 py-1.5 bg-white text-sm text-gray-400">
                                        typing...
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                }
                {isLoading && (
                    <div className="flex items-center justify-center h-full">
                        <div className="size-8 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
                    </div>
                )}
            </div>

        </section>
    );
}

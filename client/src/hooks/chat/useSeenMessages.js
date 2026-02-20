import { useEffect, useRef } from "react";

export default function useSeenMessages({
    socket,
    chatId,
    currentUserId,
    messages,
    rootRef,
}) {
    const messagesRef = useRef(messages);
    const observerRef = useRef(null);
    const observedIdsRef = useRef(new Set());
    const reportedSeenIdsRef = useRef(new Set());
    const pendingSeenIdsRef = useRef(new Set());
    const flushTimeoutRef = useRef(null);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        observedIdsRef.current = new Set();
        reportedSeenIdsRef.current = new Set();
        pendingSeenIdsRef.current = new Set();
    }, [chatId]);

    useEffect(() => {
        if (!socket || !currentUserId || !chatId || !rootRef?.current) return;

        const flushSeenMessages = () => {
            const candidateIds = [...pendingSeenIdsRef.current].filter((msgId) => {
                if (reportedSeenIdsRef.current.has(msgId)) return false;

                const msg = messagesRef.current.find((m) => m._id === msgId);
                return msg && !msg.isSeen && msg.sender?._id !== currentUserId;
            });

            pendingSeenIdsRef.current.clear();

            if (candidateIds.length === 0) return;

            candidateIds.forEach((id) => reportedSeenIdsRef.current.add(id));
            socket.emit("message:seen", {
                chatId,
                seenBy: currentUserId,
                seenMessages: candidateIds,
            });
        };

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;

                    const msgId = entry.target.getAttribute("data-message-id");
                    if (!msgId) return;

                    pendingSeenIdsRef.current.add(msgId);
                });

                clearTimeout(flushTimeoutRef.current);
                flushTimeoutRef.current = setTimeout(flushSeenMessages, 250);
            },
            { threshold: 0.75 },
        );

        observerRef.current = observer;

        return () => {
            clearTimeout(flushTimeoutRef.current);
            observer.disconnect();
            observerRef.current = null;
        };
    }, [socket, currentUserId, chatId, rootRef]);

    useEffect(() => {
        if (!observerRef.current || !rootRef?.current) return;

        const messageElements = rootRef.current.querySelectorAll("[data-message-id]");
        messageElements.forEach((el) => {
            const msgId = el.getAttribute("data-message-id");
            if (!msgId || observedIdsRef.current.has(msgId)) return;

            observedIdsRef.current.add(msgId);
            observerRef.current.observe(el);
        });
    }, [messages, rootRef]);
}

import { useCallback, useEffect, useState } from "react";
import useSocket from "../../socket/useSocket";
import ChatPresenceContext from "./ChatPresenceContext";

export default function ChatPresenceProvider({ children }) {
    const { socket, socketStatus } = useSocket();
    const [onlineUsers, setOnlineUsers] = useState({});

    const isUserOnline = useCallback(
        (participants) => {
            if (Array.isArray(participants)) {
                return participants.some(
                    (participant) => onlineUsers[participant._id] === "online",
                );
            }

            return onlineUsers[participants] === "online";
        },
        [onlineUsers],
    );

    useEffect(() => {
        if (!socket || socketStatus !== "connected") return;

        const handleOnlineUsersList = (userIds) => {
            const next = {};
            userIds.forEach((id) => {
                next[id] = "online";
            });
            setOnlineUsers(next);
        };

        const handlePresenceUpdate = ({ userId, status }) => {
            setOnlineUsers((prev) => {
                const next = { ...prev };
                if (status === "online") next[userId] = "online";
                else delete next[userId];
                return next;
            });
        };

        socket.on("onlineUsers:list", handleOnlineUsersList);
        socket.on("presence:update", handlePresenceUpdate);

        return () => {
            socket.off("onlineUsers:list", handleOnlineUsersList);
            socket.off("presence:update", handlePresenceUpdate);
        };
    }, [socket, socketStatus]);

    const data = {
        onlineUsers,
        setOnlineUsers,
        isUserOnline,
    };

    return (
        <ChatPresenceContext.Provider value={data}>
            {children}
        </ChatPresenceContext.Provider>
    );
}

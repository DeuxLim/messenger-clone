import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import useSocket from "../../socket/useSocket";
import ChatDisplayContext from "./ChatDisplayContext";

export default function ChatDisplayProvider({ children }) {
	const [typingChats, setTypingChats] = useState({});
	const [sidebarVisible, setSidebarVisible] = useState(true);
	const [isDesktop, setIsDesktop] = useState(false);
	const [isChatSettingsOpen, setIsChatSettingsOpen] = useState(false);
	const { socket, socketStatus } = useSocket();
	const { pathname } = useLocation();

	useEffect(() => {
		if (!socket || socketStatus !== "connected") return;

		socket.on("typing:update", ({ chatId, userId, status }) => {

			setTypingChats(prev => {
				const typingUsers = new Set(prev[chatId] || []);
				status === "typing" ? typingUsers.add(userId) : typingUsers.delete(userId);
				return {
					...prev,
					[chatId]: typingUsers.size ? [...typingUsers] : undefined,
				};
			});
		});

		return () => socket.off("typing:update");
	}, [socket, socketStatus]);

	// ---- Responsive Layout ----
	useEffect(() => {
		const desktopQuery = window.matchMedia("(min-width: 768px)");

		const updateLayout = (e) => {
			setIsDesktop(e.matches);
			if (!e.matches) {
				setIsChatSettingsOpen(false);
			}
		};

		updateLayout(desktopQuery);
		desktopQuery.addEventListener("change", updateLayout);
		return () => desktopQuery.removeEventListener("change", updateLayout);
	}, []);

	useEffect(() => {
		if (pathname !== "/chats/new" || !isChatSettingsOpen) return;
		setIsChatSettingsOpen(false);
	}, [pathname, isChatSettingsOpen]);

	const data = {
		typingChats, setTypingChats,
		sidebarVisible, setSidebarVisible,
		isDesktop, setIsDesktop,
		isChatSettingsOpen, setIsChatSettingsOpen
	};

	return (
		<ChatDisplayContext.Provider value={data}>
			{children}
		</ChatDisplayContext.Provider>
	);
}

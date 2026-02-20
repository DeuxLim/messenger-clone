import { useCallback, useEffect, useRef } from "react";
import { Navigate, Outlet, useMatch, useParams } from "react-router";

import { getOtherParticipants, isEmpty } from "../../../utilities/utils";
import { getMessages } from "../../../services/chats.service";

import ChatBoxHeader from "./ChatBoxHeader";
import ChatSearchInput from "./ChatSearchInput";

import useAuth from "../../../contexts/auth/useAuth";
import useActiveChat from "../../../contexts/chat/ActiveChat/useActiveChat";
import { joinChat } from "../../../realtime/presenceSocket";
import useChatData from "../../../contexts/chat/ChatData/useChatData";
import useChatSession from "../../../contexts/chat/ChatSession/useChatSession";
import useToast from "../../../contexts/ui/useToast";
import { getErrorMessage } from "../../../utilities/errors";

export default function ChatLayout() {
	const { currentUser } = useAuth();
	const toast = useToast();
	const { usersAndChatsList } = useChatData();
	const {
		activeChatData,
		clearActiveChat,
		clearActiveChatMessages,
		setActiveChatMessages,
		setNormalizedActiveChat,
	} = useChatSession();

	const { selectedChats } = useActiveChat();

	const { chatId } = useParams();
	const isSelectingChat = !!useMatch("/chats/new");

	const prevSelectedChatsRef = useRef(null);

	const chatExists = usersAndChatsList.some(chat => chat._id === chatId);

	/* ---------------- Helpers ---------------- */

	const findExistingOneToOneChat = useCallback(
		(participants) => {
			return usersAndChatsList.find(chat => {
				if (chat.type !== "chat" || chat.isGroup) return false;
				if (!Array.isArray(chat.participants)) return false;

				const chatIds = chat.participants.map(u => u._id).sort();
				const selectedIds = participants.map(u => u._id).sort();

				return (
					chatIds.length === selectedIds.length &&
					chatIds.every((id, i) => id === selectedIds[i])
				);
			});
		},
		[usersAndChatsList]
	);

	const handleNewChat = useCallback(async () => {
		if (isEmpty(selectedChats)) return;

		clearActiveChat();
		clearActiveChatMessages();

		const selectedUsers = selectedChats.map(item =>
			item.type === "chat"
				? getOtherParticipants(item.participants, currentUser._id)[0]
				: item
		);

		const participants = [...selectedUsers, currentUser];
		const existingChat = findExistingOneToOneChat(participants);

		if (!existingChat) {
			setNormalizedActiveChat({
				type: "temp",
				isGroup: participants.length > 2,
				participants,
			});
			return;
		}

		const messages = await getMessages(existingChat._id);
		setActiveChatMessages(messages);
		setNormalizedActiveChat(existingChat);
	}, [
		selectedChats,
		currentUser,
		findExistingOneToOneChat,
		setNormalizedActiveChat,
		setActiveChatMessages,
		clearActiveChat,
		clearActiveChatMessages
	]);

	const handleExistingChat = useCallback(() => {
		const chat = usersAndChatsList.find(chat => chat._id === chatId);
		if (chat) setNormalizedActiveChat(chat);
	}, [usersAndChatsList, chatId, setNormalizedActiveChat]);

	/* ---------------- Main Loader ---------------- */

	const loadChat = useCallback(async () => {
		try {
			if (isSelectingChat) {
				await handleNewChat();
			} else {
				handleExistingChat();
			}
		} catch (err) {
			toast.error(getErrorMessage(err, "Failed to load chat."));
		} finally {
			prevSelectedChatsRef.current = selectedChats;
		}
	}, [
		isSelectingChat,
		selectedChats,
		handleNewChat,
		handleExistingChat,
		toast,
	]);

	/* ---------------- Effects ---------------- */

	// Load / reload chat
	useEffect(() => {
		if (
			isSelectingChat &&
			prevSelectedChatsRef.current === selectedChats
		) return;

		loadChat();
	}, [loadChat, isSelectingChat, selectedChats]);

	// Clear when no selection in /chats/new
	useEffect(() => {
		if (!isSelectingChat || !isEmpty(selectedChats)) return;

		clearActiveChat();
		clearActiveChatMessages();
	}, [isSelectingChat, selectedChats, clearActiveChat, clearActiveChatMessages]);

	useEffect(() => {
		if (!activeChatData) return;
		joinChat(activeChatData._id);
	}, [activeChatData])

	// Cleanup on unmount
	/* 	useEffect(() => {
			return () => {
				setSelectedChats([]);
				clearActiveChat();
				clearActiveChatMessages();
			};
		}, [setSelectedChats, clearActiveChat, clearActiveChatMessages]); */

	/* ---------------- Guards ---------------- */

	if (!chatExists && !isSelectingChat) {
		return <Navigate to="/chats" replace />;
	}

	/* ---------------- UI ---------------- */

	return (
		<div className="flex flex-col h-full">
			{isSelectingChat ? <ChatSearchInput /> : <ChatBoxHeader />}
			{!isEmpty(activeChatData) && <Outlet />}
		</div>
	);
}

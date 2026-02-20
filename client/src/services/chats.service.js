import {
	createChatAPI,
	deleteChatAPI,
	getChatMessagesAPI,
	getMessagesAPI,
	getUserChatsAPI,
	searchChatsAndUsersAPI,
} from "../api/chats.api";
import { getSuggestedUsersAPI } from "../api/users.api";
import { joinChats } from "../realtime/presenceSocket";

export const loadChatOverview = async () => {
	const [chats, users] = await Promise.all([
		getUserChatsAPI(),
		getSuggestedUsersAPI(),
	]);

	joinChats(chats.map((c) => c._id));

	return { chats, users };
};

export const searchChatAndUsers = async (searchQuery) => {
	const res = await searchChatsAndUsersAPI(searchQuery);

	return res;
};

export const getChatMessages = async (chatId) => {
	if (!chatId) throw new Error("chatId is required");

	const res = await getChatMessagesAPI(chatId);

	// Expect array ALWAYS
	return Array.isArray(res) ? res : [];
};

export const createChat = async ({ id, participants, chatName, clientTempChatId }) => {
	const res = await createChatAPI({ id, participants, chatName, clientTempChatId });

	return res;
};

export const getMessages = async (chatId) => {
	const res = await getMessagesAPI(chatId);

	const messages = Array.isArray(res)
		? res
		: Array.isArray(res?.messages)
			? res.messages
			: [];

	return messages;
};

export const deleteChat = async (chatId) => {
	if (!chatId) throw new Error("chatId is required");

	return deleteChatAPI(chatId);
};

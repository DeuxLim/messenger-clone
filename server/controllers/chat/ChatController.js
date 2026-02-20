import mongoose from "mongoose";
import User from "../../models/user.js";
import Chat from "../../models/chat.js";
import Message from "../../models/message.js";
import { addMessageToChat } from "./../../services/messageService.js";

// this should expect to receive the following :
// 1. type of chat : private or group
// 2. Chat participants
// 3. if chat is private,
// 		Flow :
// 			1. check if chat exists for both users
// 			2. if exists, return existing chat collection and chat user
//			3. if not exists, return new chat collection and chat user
// 4. if chat is group,
// 		Flow :
// 			1. Check if chat exists,
//			2. if exists, return existing chat collation and chat users
//			3. if not, return new chat collection and chat users
//
// What this function should return is the following :
// 1. Chat collection
// 2. Chat participants

const findOrCreateChat = async (req, res) => {
	try {
		// Get request ID
		const id = req.body.id;
		const clientTempChatId = req.body.clientTempChatId ?? null;
		if (!mongoose.Types.ObjectId.isValid(id) && id !== null) {
			return res.status(400).json({ message: "Invalid ID format" });
		}

		// Get current user
		const currentUser = await User.findOne({ email: req.user.email });

		let chatParticipantsIds = [];
		if (id !== null) {
			/**
			 * Handle when current user selects a Chat-List Item
			 */
			// Check first if chat exists
			const existingChat = await Chat.findById(id)
				.populate(
					"participants",
					"_id fullName userName firstName lastName email isOnline lastSeen profilePicture",
				)
				.populate("lastMessage");

			// Return existing chat
			if (existingChat) {
				if (
					Array.isArray(existingChat.deletedFor) &&
					existingChat.deletedFor.some(
						(userId) => String(userId) === String(currentUser._id),
					)
				) {
					await Chat.findByIdAndUpdate(existingChat._id, {
						$pull: { deletedFor: currentUser._id },
					});
					existingChat.deletedFor = existingChat.deletedFor.filter(
						(userId) => String(userId) !== String(currentUser._id),
					);
				}

				return res.status(200).json({
					message: "chat exists",
					data: {
						isNew: false,
						chat: existingChat,
					},
				});
			}

			/**
			 * Handle when current user selects a USER-List Item (NON Chat-List Item)
			 * with existing chat
			 */
			// Check if chat exists with the selected user
			let existingChatByUser = await Chat.findOne({
				isGroup: false,
				participants: { $all: [id, currentUser._id], $size: 2 },
			})
				.populate(
					"participants",
					"_id fullName userName firstName lastName email isOnline lastSeen profilePicture",
				)
				.populate("lastMessage");

			// Return existing chat
			if (existingChatByUser) {
				if (
					Array.isArray(existingChatByUser.deletedFor) &&
					existingChatByUser.deletedFor.some(
						(userId) => String(userId) === String(currentUser._id),
					)
				) {
					await Chat.findByIdAndUpdate(existingChatByUser._id, {
						$pull: { deletedFor: currentUser._id },
					});
					existingChatByUser.deletedFor =
						existingChatByUser.deletedFor.filter(
							(userId) => String(userId) !== String(currentUser._id),
						);
				}

				return res.status(200).json({
					message: "chat exists",
					data: {
						isNew: false,
						chat: existingChatByUser,
					},
				});
			}

			/**
			 * Handle when current user selects a chat/user without existing chat
			 */
			const selectedUser = await User.findById(id);
			if (!selectedUser) {
				return res.status(200).json({
					error: {
						message: "Chat not found",
					},
				});
			}

			chatParticipantsIds = [id, currentUser._id];
		} else {
			chatParticipantsIds = req.body.participants.map((p) => p._id);

			// For new-message flow (id === null), reuse existing 1:1 chat if present
			if (chatParticipantsIds.length === 2) {
				let existingChatByParticipants = await Chat.findOne({
					isGroup: false,
					participants: { $all: chatParticipantsIds, $size: 2 },
				})
					.populate(
						"participants",
						"_id fullName userName firstName lastName email isOnline lastSeen profilePicture",
					)
					.populate("lastMessage");

				if (existingChatByParticipants) {
					if (
						Array.isArray(existingChatByParticipants.deletedFor) &&
						existingChatByParticipants.deletedFor.some(
							(userId) => String(userId) === String(currentUser._id),
						)
					) {
						await Chat.findByIdAndUpdate(existingChatByParticipants._id, {
							$pull: { deletedFor: currentUser._id },
						});
						existingChatByParticipants.deletedFor =
							existingChatByParticipants.deletedFor.filter(
								(userId) => String(userId) !== String(currentUser._id),
							);
					}

					const existingChatObject =
						existingChatByParticipants.toObject
							? existingChatByParticipants.toObject()
							: existingChatByParticipants;

					const finalChat = clientTempChatId
						? { ...existingChatObject, clientTempChatId }
						: existingChatObject;

					return res.status(200).json({
						message: "chat exists",
						data: {
							isNew: false,
							chat: finalChat,
						},
					});
				}
			}
		}

		const isMultipleParticipants = chatParticipantsIds.length > 2;
		const chatName = req.body.chatName ?? null;

		// Create Chat
		const newChat = await Chat.create({
			isGroup: isMultipleParticipants,
			participants: chatParticipantsIds,
			chatName: chatName,
			lastMessage: null,
		});

		const populatedChat = await Chat.findById(newChat._id)
			.populate(
				"participants",
				"_id fullName userName firstName lastName email isOnline lastSeen profilePicture",
			)
			.populate("lastMessage");

		const chat = populatedChat.toObject
			? populatedChat.toObject()
			: populatedChat;

		const finalChat = clientTempChatId
			? { ...chat, clientTempChatId }
			: chat;

		return res.status(200).json({
			message: "created new chat",
			data: {
				isNew: true,
				chat: finalChat,
			},
		});
	} catch (error) {
		console.error("Error fetching chat:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to create chat",
			error,
		});
	}
};

const getUserChats = async (req, res) => {
	const currentUser = await User.findOne({ email: req.user.email });

	const existingChats = await Chat.find({
		participants: currentUser._id,
		deletedFor: { $ne: currentUser._id },
	})
		.populate("participants")
		.populate({
			path: "lastMessage",
			populate: "sender",
		})
		.sort({ updatedAt: -1 })
		.lean();

	const chats = existingChats.filter((chat) => chat.lastMessage != null);

	const chatsWithUnreadCount = await Promise.all(
		chats.map(async (chat) => {
			const clearAt =
				chat?.clearedAtBy?.get?.(String(currentUser._id)) ||
				chat?.clearedAtBy?.[String(currentUser._id)] ||
				null;

			const unreadQuery = {
				chat: chat._id,
				sender: { $ne: currentUser._id },
				isSeen: false,
				type: "user",
			};

			if (clearAt) {
				unreadQuery.createdAt = { $gte: clearAt };
			}

			const unreadCount = await Message.countDocuments(unreadQuery);

			return {
				...chat,
				unreadCount,
			};
		}),
	);

	return res.status(200).json(chatsWithUnreadCount);
};

const getChatMessages = async (req, res) => {
	try {
		const currentUser = await User.findOne({ email: req.user.email });
		const chat = await Chat.findOne({
			_id: req.params.id,
			participants: currentUser._id,
			deletedFor: { $ne: currentUser._id },
		});
		if (!chat) {
			return res.status(404).json({
				error: "Chat not found",
			});
		}

		const clearAt = chat?.clearedAtBy?.get
			? chat.clearedAtBy.get(String(currentUser._id))
			: null;

		const messageQuery = { chat: req.params.id };
		if (clearAt) {
			messageQuery.createdAt = { $gte: clearAt };
		}

		const messages = await Message.find(messageQuery)
			.populate("chat")
			.populate("sender");

		// ✅ No messages is a valid state
		return res.status(200).json(messages);
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			error: "Failed to fetch chat messages",
		});
	}
};

export const addChatMessage = async (req, res) => {
	try {
		const newMessage = await addMessageToChat({
			chatId: req.params.id,
			senderId: req.user.id,
			text: req.body.message,
		});
		return res.status(200).json(newMessage);
	} catch (error) {
		console.error(error);
		return res
			.status(500)
			.json({ message: "Failed to add message", error: error.message });
	}
};

const searchChat = async (req, res) => {
	try {
		const currentUserId = req.user.id; // assume from auth middleware
		const search = req.query.q?.trim();

		// validate search input
		if (!search) {
			return res
				.status(400)
				.json({ message: "Search query is required" });
		}

		// Get existing chats from the queried user
		const chats = await Chat.find({
			participants: currentUserId,
			isGroup: false,
			deletedFor: { $ne: currentUserId },
		})
			.populate({
				path: "participants",
				match: { fullName: { $regex: search, $options: "i" } }, // filter participant names
			})
			.populate({
				path: "lastMessage",
				select: "content sender",
			});

		const filteredChats = chats.filter(
			(chat) => chat.participants.length > 0 && chat.lastMessage !== null,
		);

		const existingChatUserIds = filteredChats.flatMap((chat) =>
			chat.participants.map((participant) => participant._id.toString()),
		);

		// Get all users with no existing chat
		const users = await User.find({
			_id: {
				$ne: currentUserId,
				$nin: existingChatUserIds,
			},
			fullName: {
				$regex: search,
				$options: "i",
			},
		}).select("fullName userName profilePicture bio isOnline lastSeen");

		// Get all group chats
		const groups = await Chat.find({
			isGroup: true,
			chatName: { $regex: search, $options: "i" },
		});

		return res.status(200).json({
			existingChats: filteredChats,
			newUsers: users,
			groupChats: groups,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			message: "Failed to search chat",
			error: error.message,
		});
	}
};

const updateChat = async (req, res) => {
	try {
		const chatId = req.params.id;
		const updatedFields = req.body.updatedFields;

		const updatedChat = await Chat.findByIdAndUpdate(
			chatId,
			{ $set: updatedFields },
			{
				new: true,
				runValidators: true,
			},
		);

		return res.status(200).json({
			updateSuccess: true,
			user: updatedChat,
		});
	} catch (error) {
		console.error("Error updating profile:", error);
		return res.status(500).json({
			updateSuccess: false,
			message: "Server error while updating chat.",
		});
	}
};

const deleteChat = async (req, res) => {
	try {
		const chatId = req.params.id;
		const currentUser = await User.findOne({ email: req.user.email });

		if (!currentUser?._id) {
			return res.status(401).json({
				deleteSuccess: false,
				message: "Unauthorized",
			});
		}

		const chat = await Chat.findOne({
			_id: chatId,
			participants: currentUser._id,
		});

		if (!chat) {
			return res.status(404).json({
				deleteSuccess: false,
				message: "Chat not found",
			});
		}

		await Chat.findByIdAndUpdate(chatId, {
			$addToSet: { deletedFor: currentUser._id },
			$set: { [`clearedAtBy.${currentUser._id}`]: new Date() },
		});

		return res.status(200).json({
			deleteSuccess: true,
			chatId,
		});
	} catch (error) {
		console.error("Error deleting chat:", error);
		return res.status(500).json({
			deleteSuccess: false,
			message: "Server error while deleting chat.",
		});
	}
};

export default {
	findOrCreateChat,
	getUserChats,
	getChatMessages,
	addChatMessage,
	searchChat,
	updateChat,
	deleteChat,
};

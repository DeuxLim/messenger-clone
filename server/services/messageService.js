// services/messageService.js
import Chat from "./../models/chat.js";
import Message from "./../models/message.js";
import cloudinary from "../library/cloudinary.js";
import User from "../models/user.js";

export const addMessageToChat = async ({
	chatId,
	senderId,
	text,
	media = [],
	type = "user",
	systemAction = "",
	initiator = null,
	targetUser = null,
	newValue = "",
}) => {
	// Verify chat exists
	const chat = await Chat.findById(chatId);
	if (!chat) throw new Error("Chat not found");

	// If a new user message is sent, restore this chat for participants
	// who previously soft-deleted it.
	if (type === "user") {
		await Chat.findByIdAndUpdate(chat._id, {
			$pull: { deletedFor: { $in: chat.participants } },
		});
	}

	// Handle media attachments
	let uploadedFiles = [];

	if (media.length > 0) {
		uploadedFiles = await Promise.all(
			media.map(async (attachment) => {
				const uploadResponse = await cloudinary.uploader.upload(
					attachment.base64,
					{
						folder: `${process.env.CLOUDINARY_FOLDER}/chat_media_uploads/${chatId}`,
						resource_type: "auto",
					},
				);

				let mediaType;
				if (uploadResponse.resource_type === "image")
					mediaType = "image";
				else if (uploadResponse.resource_type === "video")
					mediaType = "video";
				else mediaType = "file";

				return {
					url: uploadResponse.secure_url,
					publicId: uploadResponse.public_id,
					type: mediaType,
				};
			}),
		);
	}

	// Create message
	const newMessage = await Message.create({
		chat: chat._id,
		sender: senderId ?? null,
		text,
		media: uploadedFiles,
		type,
		systemAction: systemAction || undefined,
		initiator: initiator || undefined,
		targetUser: targetUser || undefined,
		newValue: typeof newValue === "string" ? newValue : "",
	});

	// Update chat's last message
	await Chat.findByIdAndUpdate(chat._id, { lastMessage: newMessage._id });

	// Populate the message with updated chat info
	await newMessage.populate([
		{
			path: "chat",
			populate: [
				{
					path: "lastMessage",
					populate: "sender",
				},
				{
					path: "participants",
				},
			],
		},
		{
			path: "sender",
		},
	]);

	// Convert to plain object
	const messageObject = newMessage.toObject();

	// FIX: Map → Object
	if (messageObject.chat?.nicknames instanceof Map) {
		messageObject.chat.nicknames = Object.fromEntries(
			messageObject.chat.nicknames,
		);
	}

	return { chat: messageObject.chat, message: messageObject };
};

function formatSystemMessage(template, data = {}) {
	if (!template) return "";

	return template.replace(/\{(\w+)\}/g, (_, key) => {
		return data[key] ?? "";
	});
}

function getSystemTemplate(action, variant) {
	const actionConfig = SYSTEM_MESSAGES[action];
	if (!actionConfig) throw new Error(`Unknown system action: ${action}`);
	if (!actionConfig[variant]) {
		throw new Error(`Missing variant "${variant}" for action "${action}"`);
	}
	return actionConfig[variant];
}

const SYSTEM_MESSAGES = {
	nickname_update: {
		self: "You set your nickname to {value}",
		self_clear: "You cleared your own nickname",
		other: "{initiator} set the nickname for {user} to {value}",
	},

	chatname_update: {
		self: "You changed the chat name to {value}",
		self_clear: "You cleared the chat name",
		other: "{initiator} changed the chat name to {value}",
		other_clear: "{initiator} cleared the chat name",
	},

	user_joined: {
		self: "You joined the chat",
		other: "{user} joined the chat",
		added: "{initiator} added {user} to the chat",
	},

	user_left: {
		self: "You left the chat",
		other: "{user} left the chat",
		removed_self: "You were removed from the chat",
		removed_other: "{initiator} removed {user} from the chat",
	},

	photo_changed: {
		self: "You changed the chat photo",
		self_clear: "You removed the chat photo",
		other: "{initiator} changed the chat photo",
		other_clear: "{initiator} removed the chat photo",
	},

	admin_added: {
		self_added: "You are now an admin",
		other_added: "{initiator} made {user} an admin",
	},

	admin_removed: {
		self_removed: "You are no longer an admin",
		other_removed: "{initiator} removed {user} as admin",
	},
};

export const updateChat = async ({
	chatId,
	updatedFields,
	systemAction,
	type,
	initiator,
	targetUser,
	newValue,
}) => {
	try {
		await Chat.findByIdAndUpdate(
			chatId,
			{ $set: updatedFields },
			{
				new: true,
				runValidators: true,
			},
		);

		const initiatorUserCollection = await User.findById(initiator);
		let targetUserCollection = null;
		if (targetUser) {
			targetUserCollection = await User.findById(targetUser);
		}

		// Prepare system message
		let perspective = "self";
		if (initiator !== targetUser || targetUser === null) {
			perspective = "other";
		}

		// Save system message (update)
		const systemMessageTemplate = getSystemTemplate(
			systemAction,
			perspective,
		);

		const params = {
			initiator: initiatorUserCollection.firstName,
			value: newValue,
		};
		if (targetUserCollection) {
			params.user = targetUserCollection.firstName;
		}
		const text = formatSystemMessage(systemMessageTemplate, params);

		const systemMessage = await addMessageToChat({
			chatId,
			text,
			type,
			systemAction,
			initiator,
			targetUser,
			newValue: typeof newValue === "string" ? newValue : "",
		});

		return systemMessage;
	} catch (error) {
		console.error("Error updating profile:", error);
	}
};

import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
	{
		isGroup: {
			type: Boolean,
			default: false,
			index: true,
		},

		participants: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
				required: true,
			},
		],

		// Group chat only
		chatName: {
			type: String,
			trim: true,
			maxlength: 50,
		},

		chatPhoto: {
			type: String, // URL
		},

		admins: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],

		// Per-user customization
		nicknames: {
			type: Map,
			of: String, // userId -> nickname
			default: {},
		},

		lastMessage: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Message",
		},

		// Per-user chat state
		mutedBy: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],

		archivedBy: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],

		// Soft delete (do NOT hard delete chats)
		deletedFor: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],

		// Per-user chat clear cutoff timestamp
		clearedAtBy: {
			type: Map,
			of: Date, // userId -> clear timestamp
			default: {},
		},

		// Audit
		updatedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
	},
	{ timestamps: true }
);

export default mongoose.model("Chat", chatSchema);

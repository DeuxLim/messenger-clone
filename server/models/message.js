import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
	{
		chat: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Chat",
			required: true,
		},
		sender: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: function () {
				return this.type === "user";
			},
		},
		text: {
			type: String,
			default: "",
		},
		media: [
			{
				url: { type: String, required: true },
				publicId: String,
				type: {
					type: String,
					enum: ["image", "video", "file"],
					required: true,
				},
			},
		],
		type: {
			type: String,
			enum: ["user", "system"],
			default: "user",
			required: true,
		},
		systemAction: {
			type: String,
			enum: [
				"user_joined",
				"user_left",
				"photo_changed",
				"title_changed",
				"admin_added",
				"admin_removed",
				"nickname_update",
				"chatname_update",
				"chatname_updated",
			],
		},
		initiator: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
		targetUser: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
		newValue: {
			type: String,
			default: "",
		},
		isSeen: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true },
);

const Message = mongoose.model("Message", messageSchema);
export default Message;

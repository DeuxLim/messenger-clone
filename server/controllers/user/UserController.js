import User from "../../models/user.js";
import Chat from "../../models/chat.js";
import cloudinary from "../../library/cloudinary.js";
import bcrypt from "bcrypt";

// GET /users - Get all users with pagination and search
const index = async (req, res) => {
	try {
		const currentUserId = req.user.id; // From auth middleware
		res.status(200).json({
			message: "This endpoint is currently under development",
		});
	} catch (error) {
		console.error("Error fetching users:", error);
		res.status(500).json({ message: "Failed to fetch users" });
	}
};

// GET /users/suggested - Get users not chatted with
const suggested = async (req, res) => {
	try {
		const currentUserId = req.user.id;

		// Find all chats where current user is participant
		const existingChats = (
			await Chat.find({
				participants: currentUserId,
				deletedFor: { $ne: currentUserId },
			})
				.select("participants")
				.populate("lastMessage")
				.lean()
		).filter((chat) => chat.lastMessage != null);

		// Extract user IDs from those chats
		const chattedUserIds = existingChats.flatMap((chat) =>
			chat.participants
				.filter((id) => id.toString() !== currentUserId)
				.map((id) => id.toString()),
		);

		// Find users NOT in that list
		const suggestedUsers = await User.find({
			_id: {
				$ne: currentUserId,
				$nin: chattedUserIds,
			},
		})
			.select(
				"fullName firstName lastName userName profilePicture bio isOnline lastSeen",
			)
			.sort({ createdAt: -1 });

		res.status(200).json(suggestedUsers);
	} catch (error) {
		console.error("Error fetching suggested users:", error);
		res.status(500).json({ error: "Failed to fetch suggested users" });
	}
};

const updateProfile = async (req, res) => {
	try {
		const currentUserId = req.user.id;

		const { profilePicture, firstName, lastName, userName, email, bio } =
			req.body;

		const updatedFields = {};

		// ---------------- Text fields ----------------
		if (firstName !== undefined) updatedFields.firstName = firstName;
		if (lastName !== undefined) updatedFields.lastName = lastName;
		if (userName !== undefined) updatedFields.userName = userName;
		if (email !== undefined) updatedFields.email = email;
		if (bio !== undefined) updatedFields.bio = bio;

		// ---------------- Profile Picture ----------------
		// Upload ONLY if base64 string (new image)
		if (profilePicture && typeof profilePicture === "string") {
			if (profilePicture.length > 10_000_000) {
				return res.status(413).json({
					updateSuccess: false,
					message: "Image is too large. Max size is 10MB.",
				});
			}

			// Get current user to remove old image
			const existingUser =
				await User.findById(currentUserId).select("profilePicture");

			// Delete old Cloudinary image if exists
			if (existingUser?.profilePicture?.public_id) {
				await cloudinary.uploader.destroy(
					existingUser.profilePicture.public_id,
				);
			}

			// Upload new image
			const uploadResponse = await cloudinary.uploader.upload(
				profilePicture,
				{
					folder: `${process.env.CLOUDINARY_FOLDER}/user_profiles`,
					resource_type: "image",
				},
			);

			updatedFields.profilePicture = {
				public_id: uploadResponse.public_id,
				url: uploadResponse.secure_url,
			};
		}

		// ---------------- Guard ----------------
		if (Object.keys(updatedFields).length === 0) {
			return res.status(400).json({
				updateSuccess: false,
				message: "No valid fields to update.",
			});
		}

		// ---------------- Update User ----------------
		const updatedUser = await User.findByIdAndUpdate(
			currentUserId,
			{ $set: updatedFields },
			{
				new: true,
				runValidators: true,
			},
		);

		return res.status(200).json({
			updateSuccess: true,
			user: updatedUser,
		});
	} catch (error) {
		console.error("Error updating profile:", error);
		return res.status(500).json({
			updateSuccess: false,
			message: "Server error while updating profile.",
		});
	}
};

const updatePassword = async (req, res) => {
	try {
		const userId = req.user.id;
		const { currentPassword, newPassword } = req.body;

		// ---------------- Guards ----------------
		if (!currentPassword || !newPassword) {
			return res.status(400).json({
				updateSuccess: false,
				message: "Current and new password are required.",
			});
		}

		if (newPassword.length < 8) {
			return res.status(400).json({
				updateSuccess: false,
				message: "Password must be at least 8 characters.",
			});
		}

		// ---------------- Fetch user ----------------
		const user = await User.findById(userId).select(
			"+password +refreshToken +refreshTokenExpiresAt",
		);

		if (!user) {
			return res.status(404).json({
				updateSuccess: false,
				message: "User not found.",
			});
		}

		// ---------------- Verify current password ----------------
		const isMatch = await bcrypt.compare(currentPassword, user.password);

		if (!isMatch) {
			return res.status(401).json({
				updateSuccess: false,
				message: "Current password is incorrect.",
			});
		}

		// ---------------- Prevent reuse ----------------
		const isSamePassword = await bcrypt.compare(newPassword, user.password);

		if (isSamePassword) {
			return res.status(400).json({
				updateSuccess: false,
				message:
					"New password must be different from current password.",
			});
		}

		user.password = newPassword;
		user.refreshToken = null;
		user.refreshAccessToken = null;

		await user.save();

		return res.status(200).json({
			updateSuccess: true,
			message: "Password updated successfully.",
		});
	} catch (error) {
		console.error("Error updating password:", error);
		return res.status(500).json({
			updateSuccess: false,
			message: "Server error while updating password.",
		});
	}
};

export default {
	index,
	suggested,
	updateProfile,
	updatePassword,
};

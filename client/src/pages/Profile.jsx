import { useEffect, useState } from "react";
import { FiEdit } from "react-icons/fi";
import { IoMdArrowBack } from "react-icons/io";
import { IoCameraOutline } from "react-icons/io5";
import { useNavigate } from "react-router";
import defaultUserImage from "../assets/images/default-user.png"
import useAuth from "../contexts/auth/useAuth";
import useToast from "../contexts/ui/useToast";

export default function Profile() {
	const {
		currentUser,
		updateUserProfile,
		updatePassword,
	} = useAuth();

	const navigate = useNavigate();
	const toast = useToast();

	const [isEditMode, setIsEditMode] = useState(false);
	const [formData, setFormData] = useState(null);
	const [previewImg, setPreviewImg] = useState(null);

	const [showPasswordForm, setShowPasswordForm] = useState(false);
	const [passwordData, setPasswordData] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	const editableFields = {
		firstName: "First Name",
		lastName: "Last Name",
		userName: "Username",
		email: "Email",
		bio: "Bio",
	};

	useEffect(() => {
		if (currentUser) {
			setFormData(currentUser);
			setPreviewImg(currentUser.profilePicture?.url || null);
		}
	}, [currentUser]);

	if (!formData) return null;

	// ---------------- Handlers ----------------

	const handleChange = (field, value) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleImageUpload = (e) => {
		const file = e.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.readAsDataURL(file);

		reader.onload = () => {
			setPreviewImg(reader.result);
		};
	};

	const handleSaveProfile = async () => {
		const updates = {};

		Object.keys(editableFields).forEach((field) => {
			if (formData?.[field] !== currentUser?.[field]) {
				updates[field] = formData?.[field];
			}
		});

		const hasNewProfileImage =
			typeof previewImg === "string" &&
			previewImg.startsWith("data:") &&
			previewImg !== currentUser?.profilePicture?.url;

		if (hasNewProfileImage) {
			updates.profilePicture = previewImg;
		}

		if (Object.keys(updates).length === 0) {
			toast.info("No changes to save.");
			setIsEditMode(false);
			return;
		}

		await updateUserProfile(updates);
		setIsEditMode(false);
	};

	const handleCancelProfileEdit = () => {
		setFormData(currentUser);
		setPreviewImg(currentUser.profilePicture?.url || null);
		setIsEditMode(false);
	};

	const handlePasswordChange = async () => {
		const { currentPassword, newPassword, confirmPassword } = passwordData;

		if (!currentPassword || !newPassword) {
			toast.error("All password fields are required.");
			return;
		}

		if (newPassword !== confirmPassword) {
			toast.error("Passwords do not match.");
			return;
		}

		await updatePassword({
			currentPassword,
			newPassword,
		});

		setPasswordData({
			currentPassword: "",
			newPassword: "",
			confirmPassword: "",
		});

		setShowPasswordForm(false);
	};

	// ---------------- UI ----------------

	return (
		<div className="min-h-screen bg-gray-50 p-6 md:p-10">
			<div className="max-w-4xl mx-auto space-y-8">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
						<p className="text-sm text-gray-500">
							Manage your personal information
						</p>
					</div>

					<button
						onClick={() => navigate(-1)}
						className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100"
					>
						<IoMdArrowBack />
						Back
					</button>
				</div>

				{/* Profile Card */}
				<div className="bg-white rounded-2xl shadow-sm border border-gray-200">
					{/* Avatar */}
					<div className="flex flex-col items-center gap-4 border-b border-gray-300 p-8">
						<div className="relative">
							<div className="size-32 rounded-full overflow-hidden ring-4 ring-gray-100">
								<img
									src={previewImg || defaultUserImage}
									alt="Profile"
									className="w-full h-full object-cover"
								/>
							</div>

							{isEditMode && (
								<label className="absolute bottom-1 right-1 bg-black text-white p-2 rounded-full cursor-pointer hover:scale-105 transition">
									<IoCameraOutline />
									<input
										type="file"
										className="hidden"
										accept="image/*"
										onChange={handleImageUpload}
									/>
								</label>
							)}
						</div>

						<div className="text-center">
							<h2 className="text-xl font-semibold">
								{formData.firstName} {formData.lastName}
							</h2>
							<p className="text-sm text-gray-500">@{formData.userName}</p>
						</div>
					</div>

					{/* Profile Info */}
					<div className="p-8">
						<h3 className="text-lg font-semibold mb-6">
							Personal Information
						</h3>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{Object.entries(editableFields).map(([key, label]) => (
								<div key={key} className="space-y-1">
									<label className="text-sm font-medium text-gray-600">
										{label}
									</label>

									{isEditMode ? (
										<input
											value={formData[key] || ""}
											onChange={(e) =>
												handleChange(key, e.target.value)
											}
											className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-black focus:outline-none"
										/>
									) : (
										<div className="px-3 py-2 bg-gray-50 rounded-lg">
											{formData[key] || "—"}
										</div>
									)}
								</div>
							))}
						</div>
					</div>

					{/* Profile Actions */}
					<div className="flex justify-end gap-3 border-t border-gray-300 p-6">
						{!isEditMode ? (
							<button
								onClick={() => setIsEditMode(true)}
								className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-black text-white"
							>
								<FiEdit />
								Edit Profile
							</button>
						) : (
							<>
								<button
									onClick={handleCancelProfileEdit}
									className="px-5 py-2.5 rounded-lg border border-gray-300"
								>
									Cancel
								</button>
								<button
									onClick={handleSaveProfile}
									className="px-5 py-2.5 rounded-lg bg-black text-white"
								>
									Save Changes
								</button>
							</>
						)}
					</div>
				</div>

				{/* Password Section */}
				<div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
					<h3 className="text-lg font-semibold mb-4">Security</h3>

					{!showPasswordForm ? (
						<button
							onClick={() => setShowPasswordForm(true)}
							className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
						>
							Change Password
						</button>
					) : (
						<div className="space-y-4 max-w-md">
							<input
								type="password"
								placeholder="Current Password"
								value={passwordData.currentPassword}
								onChange={(e) =>
									setPasswordData({
										...passwordData,
										currentPassword: e.target.value,
									})
								}
								className="w-full border rounded-lg px-3 py-2"
							/>

							<input
								type="password"
								placeholder="New Password"
								value={passwordData.newPassword}
								onChange={(e) =>
									setPasswordData({
										...passwordData,
										newPassword: e.target.value,
									})
								}
								className="w-full border rounded-lg px-3 py-2"
							/>

							<input
								type="password"
								placeholder="Confirm New Password"
								value={passwordData.confirmPassword}
								onChange={(e) =>
									setPasswordData({
										...passwordData,
										confirmPassword: e.target.value,
									})
								}
								className="w-full border rounded-lg px-3 py-2"
							/>

							<div className="flex gap-3">
								<button
									onClick={() => setShowPasswordForm(false)}
									className="px-4 py-2 rounded-lg border"
								>
									Cancel
								</button>
								<button
									onClick={handlePasswordChange}
									className="px-4 py-2 rounded-lg bg-black text-white"
								>
									Update Password
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

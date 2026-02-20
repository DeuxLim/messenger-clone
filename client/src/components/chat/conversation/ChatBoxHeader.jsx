import { IoVideocam, IoCall } from "react-icons/io5";
import { IoMdArrowBack } from "react-icons/io";
import { HiDotsCircleHorizontal } from "react-icons/hi";
import AvatarWithStatus from "../global/AvatarWithStatus";
import { getOtherParticipant, isEmpty } from "../../../utilities/utils";
import { useNavigate } from "react-router";
import useOtherParticipants from "../../../hooks/chat/useOtherParticipants";
import AvatarImage from "../global/AvatarImage";
import { useMemo } from "react";
import useAuth from "../../../contexts/auth/useAuth";
import useChatDisplay from "../../../contexts/chat/ChatDisplay/useChatDisplay";
import useChatPresence from "../../../contexts/chat/ChatPresence/useChatPresence";
import useChatSession from "../../../contexts/chat/ChatSession/useChatSession";

export default function ChatBoxHeader() {
	const { activeChatData } = useChatSession();
	const { isUserOnline } = useChatPresence();
	const { currentUser } = useAuth();
	const { setIsChatSettingsOpen } = useChatDisplay();
	const navigate = useNavigate();
	const chatParticipants = useOtherParticipants(activeChatData, currentUser._id);

	const userStatus = useMemo(() => {
		const targetId = activeChatData?.isGroup ? chatParticipants : chatParticipants[0]?._id

		return isUserOnline(targetId) ? "online" : "offline";
	}, [activeChatData, chatParticipants, isUserOnline]);

	const isGroup = !!activeChatData?.isGroup;
	const otherUser = !isGroup
		? getOtherParticipant(activeChatData?.participants, currentUser?._id)
		: null;

	const chatName = isGroup
		? activeChatData?.chatName ? activeChatData?.chatName : activeChatData?.participants.map((u) => {
			return u.firstName
		}).join(", ")
		: !isEmpty(activeChatData?.nicknames[otherUser._id]) ? activeChatData?.nicknames[otherUser._id] : otherUser?.fullName ? `${otherUser?.fullName}`.trim()
			: `${otherUser?.firstName ?? ""} ${otherUser?.lastName ?? ""}`.trim();

	// --- Event Handlers ---
	const handleBackClick = () => {
		navigate("/chats", { replace: true })
	};

	const handleChatMenuClick = () => {
		setIsChatSettingsOpen(prev => !prev);
	}

	/* const handleVideoCall = () => {
		console.log("Start video call");
		// Placeholder for future video call logic
	};
	const handleVoiceCall = () => {
		console.log("Start video call");
		// Placeholder for future video call logic
	}; */

	return (
		<header className="h-15 border-b border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900">
			<div className="flex items-center justify-between h-full px-1">
				{/* Back button (mobile only) */}
				<button
					onClick={handleBackClick}
					className="text-2xl md:hidden hover:text-gray-700 dark:hover:text-gray-200 hover:rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 size-10 flex justify-center items-center"
					aria-label="Back"
				>
					<div className="text-md text-blue-500">
						<IoMdArrowBack />
					</div>
				</button>

				{/* Chat info */}
				<div className="flex flex-1 items-center gap-3 overflow-hidden h-full">
					{/* Display Photo */}
					<div className={`flex justify-center items-center relative h-10 w-15`}>
						{chatParticipants?.slice(0, 2).map((p, index) => {
							const displayPhotos = isGroup ? (
								<div key={p?._id}>
									<div
										className={`absolute ${index === 1 ? 'right-6 top-3' : 'left-6 bottom-3'}`}
									>
										<div className="size-7 rounded-full overflow-hidden">
											<AvatarImage chatPhotoUrl={p?.profilePicture?.url} />
										</div>
									</div>

									{/* Status Icon */}
									{
										userStatus === "online" && (
											<div className="absolute right-0 bottom-0">
												<div className="size-3.5 border-2 border-white rounded-full bg-green-500"></div>
											</div>
										)
									}
								</div>
							) : (
								<div key={p?._id}>
									<AvatarWithStatus
										chatPhotoUrl={isGroup ? activeChatData?.chatPhotoUrl : otherUser?.profilePicture?.url}
										userStatus={userStatus === "online" ? "online" : "offline"}
										containerClass="size-10"
									/>
								</div>
							);

							return displayPhotos;
						})}
					</div>



					<div className="flex flex-col truncate">
						<span className="font-normal truncate">{chatName}</span>
						{(
							<span className="text-xs text-gray-500 dark:text-gray-400">
								{userStatus === "online" ? "Online" : !isGroup ? otherUser?.lastSeen
									? `Last seen ${new Date(otherUser.lastSeen).toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit",
									})}`
									: "Offline" : "Offline"}
							</span>
						)}
					</div>
				</div>

				{/* <button
					onClick={handleVoiceCall}
					className="text-xl p-2 hover:text-blue-500 transition-colors text-blue-500"
					aria-label="Start video call"
				>
					<IoCall />
				</button> */}

				{/* Video call button */}
				{/* <button
					onClick={handleVideoCall}
					className="text-xl p-2 hover:text-blue-500 transition-colors text-blue-500"
					aria-label="Start video call"
				>
					<IoVideocam />
				</button> */}

				<button
					onClick={handleChatMenuClick}
					className="text-xl p-2 hover:text-blue-500 transition-colors text-blue-500"
					aria-label="Start video call"
				>
					<HiDotsCircleHorizontal />
				</button>

			</div>
		</header>
	);
}

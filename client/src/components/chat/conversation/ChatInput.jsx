import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import useAuth from "../../../contexts/auth/useAuth";
import useSocket from "../../../contexts/socket/useSocket";
import { FaThumbsUp } from "react-icons/fa6";
import { FaRegImage } from "react-icons/fa6";
import { isEmpty } from "../../../utilities/utils";
import { RxCross2 } from "react-icons/rx";
import { LuCopyPlus } from "react-icons/lu";
import { HiPaperAirplane } from "react-icons/hi2";
import { createChat } from "../../../services/chats.service";
import useActiveChat from "../../../contexts/chat/ActiveChat/useActiveChat";
import { joinChat } from "../../../realtime/presenceSocket";
import useChatData from "../../../contexts/chat/ChatData/useChatData";
import useChatSession from "../../../contexts/chat/ChatSession/useChatSession";

export default function ChatInput() {
	const [message, setMessage] = useState("");
	const { setChatItems } = useChatData();
	const { activeChatData, addOptimisticMessage, setNormalizedActiveChat, setActiveChatMessages } = useChatSession();
	const { setSelectedChats } = useActiveChat();
	const { currentUser } = useAuth();
	const { socket } = useSocket();
	const navigate = useNavigate();
	const fileInputRef = useRef(null);
	const [selectedMediaAttachments, setSelectedMediaAttachments] = useState([]);

	// ---- Handlers ----
	const handleSendMessage = useCallback(
		async (e) => {
			e.preventDefault();
			const trimmedMessage = message.trim();
			const finalMessage = !trimmedMessage && isEmpty(selectedMediaAttachments) ? "👍" : trimmedMessage;

			try {
				// Send Optimistic Message
				const now = new Date().toISOString();
				let tempMessageId = `temp-message-${crypto.randomUUID()}`;
				let chatData = activeChatData;

				// Prepare message structure
				const optimisticMessage = {
					_id: tempMessageId,
					chat: chatData,
					sender: {
						_id: currentUser._id,
						firstName: currentUser.firstName,
						lastName: currentUser.lastName,
						profilePicture: currentUser.profilePicture,
					},
					text: finalMessage,
					media: selectedMediaAttachments,
					createdAt: now,
					isSeen: false,
					status: "sending",
					type: "user",
				};

				// Add optimistic message
				addOptimisticMessage(optimisticMessage, chatData);

				// Create chat if target chat is temporary
				if (chatData.type === "temp") {
					const res = await createChat({
						id: null,
						clientTempChatId: chatData?.clientTempChatId,
						participants: chatData.participants,
						chatName: chatData.chatName
					});
					chatData = res?.data?.chat;

					if (res?.error || !res?.data?.chat?._id) {
						navigate("/chats", { replace: true });
						return;
					}

					joinChat(chatData?._id);

				}

				// update optimistic messages chat data
				setActiveChatMessages(prev =>
					prev.map((message) => {
						if (message._id === tempMessageId) {
							return { ...message, chat: chatData };
						} else {
							return message;
						}
					}
					)
				);

				// For Main Chat Window 
				setNormalizedActiveChat(chatData);

				// For SideBar
				setChatItems(prev => {
					const chatKey = chatData.clientTempChatId;

					const index = prev.findIndex(
						chat => chat.clientTempChatId === chatKey
					);

					// not found
					if (index === -1) {
						return prev;
					}

					// update + move to top
					const updatedChat = {
						...prev[index],
						...chatData,
						clientTempChatId: null,
						lastMessage: prev[index].lastMessage,
					};

					return [
						updatedChat,
						...prev.slice(0, index),
						...prev.slice(index + 1),
					];
				});

				setSelectedChats([]);

				// Send message through socket
				socket?.emit("sendMessage", {
					tempMessageId: tempMessageId ?? null,
					chatId: chatData._id,
					senderId: currentUser._id,
					text: finalMessage,
					media: selectedMediaAttachments,
				});

				navigate(`/chats/${chatData._id}`, { replace: true });
				setMessage("");
				setSelectedMediaAttachments([]);
			} catch (err) {
				console.error("Message send failed:", err);
			}
		},

		// Dependencies
		[
			message,
			currentUser,
			navigate,
			socket,
			activeChatData,
			selectedMediaAttachments,
			addOptimisticMessage,
			setActiveChatMessages,
			setNormalizedActiveChat,
			setChatItems,
			setSelectedChats,
		]
	);

	// ---- Typing Indicator ----
	useEffect(() => {
		if (!socket || !activeChatData?._id || !currentUser?._id) return;

		const trimmed = message.trim();

		if (trimmed) {
			socket.emit("typing:start", {
				chatId: activeChatData._id,
				userId: currentUser._id,
			});

			const timeout = setTimeout(() => {
				socket.emit("typing:stop", {
					chatId: activeChatData._id,
					userId: currentUser._id,
				});
			}, 1500);

			return () => clearTimeout(timeout);
		} else {
			socket.emit("typing:stop", {
				chatId: activeChatData._id,
				userId: currentUser._id,
			});
		}
	}, [message, socket, activeChatData?._id, currentUser?._id]);

	const handleMediaAttachmentTrigger = () => {
		fileInputRef.current?.click();
	};

	const handleMediaAttachment = (e) => {
		const files = Array.from(e.target.files);
		if (files.length === 0) return;

		files.forEach(file => {
			const reader = new FileReader();

			reader.onload = () => {
				const base64 = reader.result;

				setSelectedMediaAttachments(prev => [
					...prev,
					{
						id: crypto.randomUUID(),
						file,                          // full file object
						base64,                        // encoded image
						type: file.type,               // mime type (image/png, video/mp4)
						name: file.name,               // "photo.png"
						size: file.size,               // in bytes
						extension: file.name.split('.').pop(),
						previewUrl: URL.createObjectURL(file),
					}
				]);
			};

			reader.readAsDataURL(file);
		});

		// reset file input so selecting the same file again triggers onChange
		e.target.value = null;
	};

	const handleRemoveMedia = (toRemoveId) => {
		setSelectedMediaAttachments(prev => {
			const updated = prev.filter(item => item.id !== toRemoveId);

			// if no files left, clear file input value
			// prevents same-file selection from being ignored
			if (updated.length === 0 && fileInputRef.current) {
				fileInputRef.current.value = null;
			}

			return updated;
		});
	};

	const renderMedia = (media) => {
		if (media.type.startsWith("image/")) {
			return (
				<img
					src={media.previewUrl}
					className="w-full h-full object-cover rounded-xl"
					alt=""
				/>
			);
		}

		if (media.type.startsWith("video/")) {
			return (
				<video
					src={media.previewUrl}
					className="w-full h-full object-cover"
					controls
				/>
			);
		}

		return <div className="text-xs text-gray-500">Unsupported</div>;
	};

	useEffect(() => {
		return () => {
			setSelectedMediaAttachments([]);
			setMessage("");
		}
	}, [activeChatData]);

	useEffect(() => {
		return () => {
			// revoke object URLs to avoid memory leaks from image/video previews
			selectedMediaAttachments.forEach(m => URL.revokeObjectURL(m.previewUrl));
		};
	}, [selectedMediaAttachments]);

	// ---- Render ----
	return (
		<footer className="min-h-16 p-3 sticky bottom-0">
			<form onSubmit={handleSendMessage} className="flex h-full gap-3 justify-center items-center">

				{/* isEmpty(message.trim()) &&  */(
					<>
						<button
							type="button"
							className="text-xl text-blue-500 size-10 hover:bg-gray-100 rounded-full flex justify-center items-center"
							onClick={handleMediaAttachmentTrigger}
						>
							<FaRegImage />
						</button>
						<input type="file" className="hidden" ref={fileInputRef} accept="image/*, video/*" onChange={handleMediaAttachment} multiple />
					</>
				)}

				{/* Chat Message Input */}
				<div
					className="flex-1 rounded-2xl flex flex-col overflow-hidden bg-gray-100"
				>
					{/* Media Attachments Preview */}
					<div className={`w-full h-24 flex gap-4 p-4 ${isEmpty(selectedMediaAttachments) && "hidden"}`}>
						{!isEmpty(selectedMediaAttachments) && (() => {
							return (
								<>
									<button
										type="button"
										className="relative size-12 rounded-xl bg-gray-200 flex justify-center items-center"
										onClick={handleMediaAttachmentTrigger}
									>
										<LuCopyPlus className="text-3xl" />
									</button>
									{selectedMediaAttachments.map(media => (
										<div className="relative size-12 rounded-xl" key={media.id}>
											{renderMedia(media)}

											<button
												type="button"
												onClick={() => handleRemoveMedia(media.id)}
												className="size-7 rounded-full border border-gray-300 bg-gray-50 absolute -top-2.5 -right-2.5 flex justify-center items-center"
											>
												<RxCross2 className="text-xs" />
											</button>
										</div>
									))}
								</>
							)

						})()}
					</div>

					{/* Text Input */}
					<input
						type="text"
						placeholder="Aa"
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						className="focus:outline-none h-9 flex items-center w-full rounded-2xl px-3"
					/>
				</div>

				<button
					type="submit"
					className="size-10 rounded-full flex items-center justify-center text-blue-500 text-xl hover:bg-gray-100"
				>
					{isEmpty(message) && isEmpty(selectedMediaAttachments) ? <FaThumbsUp /> : <HiPaperAirplane />}
				</button>
			</form>
		</footer>
	);
}

import { getOtherParticipant, getOtherParticipants } from '../../../utilities/utils';
import useOtherParticipants from '../../../hooks/chat/useOtherParticipants';
import AvatarImage from '../global/AvatarImage';
import { RxCaretRight, RxCaretDown } from "react-icons/rx";
import useToggle from '../../../hooks/common/useToggle';
import CenterPopUpModal from '../../common/CenterPopUpModal';
import { RiEdit2Fill } from "react-icons/ri";
import { IoMdArrowBack } from "react-icons/io";
import { IoMdCheckmark } from "react-icons/io";
import { useMemo, useState } from 'react';
import { MdModeEdit } from "react-icons/md";
import { useNavigate } from "react-router";
import useAuth from '../../../contexts/auth/useAuth';
import useChatDisplay from '../../../contexts/chat/ChatDisplay/useChatDisplay';
import useSocket from '../../../contexts/socket/useSocket';
import useChatPresence from '../../../contexts/chat/ChatPresence/useChatPresence';
import useChatSession from '../../../contexts/chat/ChatSession/useChatSession';
import useChatData from '../../../contexts/chat/ChatData/useChatData';
import useChatSearch from '../../../contexts/chat/ChatSearch/useChatSearch';
import { deleteChat } from '../../../services/chats.service';
import useToast from '../../../contexts/ui/useToast';
import { getErrorMessage } from '../../../utilities/errors';

export default function ChatSettings() {
    const { activeChatData, clearActiveChat, clearActiveChatMessages } = useChatSession();
    const { setChatItems, setUserItems } = useChatData();
    const { updateChatSearchResults } = useChatSearch();
    const { isUserOnline } = useChatPresence();
    const { currentUser } = useAuth();
    const [isCustomizeChatExpanded, setIsCustomizeChatExpanded] = useToggle();
    const [isChatMembersExpanded, setIsChatMembersExpanded] = useToggle();
    const [isNicknameEditModalDisplayed, setIsNicknameEditModalDisplayed] = useToggle();
    const [editingParticipantId, setEditingParticipantId] = useState(null);
    const [isChatNameEditModalDisplayed, setIsChatNameEditModalDisplayed] = useToggle();
    const [isDeleteChatModalDisplayed, setIsDeleteChatModalDisplayed] = useToggle();
    const [chatName, setChatName] = useState(activeChatData?.chatName || "");
    const { setIsChatSettingsOpen } = useChatDisplay();
    const [updatedNickname, setUpdatedNickname] = useState({});
    const [isDeletingChat, setIsDeletingChat] = useState(false);
    const { socket } = useSocket();
    const navigate = useNavigate();
    const toast = useToast();

    const chatParticipants = useOtherParticipants(activeChatData, currentUser._id);
    const isGroup = !!activeChatData?.isGroup;
    const otherUser = !isGroup
        ? getOtherParticipant(activeChatData?.participants, currentUser?._id)
        : getOtherParticipants(activeChatData?.participants, currentUser?._id);

    const userStatus = useMemo(() => {
        const targetId = activeChatData?.isGroup ? chatParticipants : chatParticipants[0]?._id

        return isUserOnline(targetId) ? "online" : "offline";
    }, [activeChatData, chatParticipants, isUserOnline]);

    const handleChatNameUpdate = async () => {
        try {
            const payload = {
                chatId: activeChatData._id,
                updatedFields: {
                    chatName: chatName,
                },
                systemAction: "chatname_update",
                type: "system",
                initiator: currentUser._id,
                newValue: chatName,
            }

            socket.emit("chat:chatNameUpdate", payload)
            setIsChatNameEditModalDisplayed(false);
            toast.success("Chat name updated.");
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to update chat name."));
        }
    }

    const handleNicknameEdit = async () => {
        try {
            const userId = editingParticipantId;
            const nickname = updatedNickname[userId];
            const payload = {
                chatId: activeChatData._id,
                updatedFields: {
                    [`nicknames.${userId}`]: nickname,
                },
                systemAction: "nickname_update",
                type: "system",
                initiator: currentUser._id,
                targetUser: userId,
                newValue: nickname,
            }

            socket.emit("chat:updateChat", payload);
            setEditingParticipantId(null);
            toast.success("Nickname updated.");
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to update nickname."));
        }
    };

    // --- Event Handlers ---
    const handleBackClick = () => {
        setIsChatSettingsOpen(false);
    };

    const handleDeleteChat = async () => {
        if (!activeChatData?._id || isDeletingChat) return;

        try {
            setIsDeletingChat(true);
            await deleteChat(activeChatData._id);

            setChatItems((prev) =>
                prev.filter((chat) => chat._id !== activeChatData._id),
            );
            // Ensure deleted 1:1 chat user appears in "Your Contacts" immediately.
            if (!activeChatData?.isGroup) {
                const otherParticipant = activeChatData?.participants?.find(
                    (participant) => String(participant?._id) !== String(currentUser?._id),
                );

                if (otherParticipant?._id) {
                    setUserItems((prev) => {
                        const exists = prev.some(
                            (user) => String(user?._id) === String(otherParticipant._id),
                        );
                        if (exists) return prev;
                        return [otherParticipant, ...prev];
                    });
                }
            }
            clearActiveChatMessages();
            clearActiveChat();
            updateChatSearchResults({ chats: [], users: [], isSearch: false });
            setIsChatSettingsOpen(false);
            setIsDeleteChatModalDisplayed(false);
            navigate("/chats", { replace: true });
            toast.success("Chat deleted.");
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to delete chat."));
        } finally {
            setIsDeletingChat(false);
        }
    };

    return (
        <div className="h-full w-full rounded-xl shadow-sm overflow-y-auto bg-white dark:bg-gray-900 p-2 md:flex-none md:w-[clamp(260px,32vw,400px)]">
            <div className="flex justify-center items-center flex-col gap-4">

                <div className='flex justify-center items-start w-full relative'>
                    <button
                        onClick={handleBackClick}
                        className="text-2xl md:hidden hover:text-gray-700 dark:hover:text-gray-200 hover:rounded-full hover:bg-gray-100 size-10 flex justify-center items-center absolute left-0 top-0"
                        aria-label="Back"
                    >
                        <div className="text-md">
                            <IoMdArrowBack />
                        </div>
                    </button>

                    <div className='flex flex-col justify-center items-center gap-1 w-full p-4'>

                        {/* Display Photo */}
                        <div className={`flex justify-center items-center relative`}>
                            {activeChatData?.participants.length > 2 && (
                                <div className='size-20'>
                                </div>
                            )}
                            {chatParticipants?.slice(0, 2).map((p, index) => {
                                const displayPhotos = isGroup ? (
                                    <div className='' key={p?._id}>
                                        <div
                                            className={`absolute ${index === 0 ? 'right-1.5 top-2' : 'left-1.5 bottom-2'}`}
                                        >
                                            <div className="size-12 rounded-full overflow-hidden">
                                                <AvatarImage chatPhotoUrl={p?.profilePicture?.url} />
                                            </div>
                                        </div>

                                        {/* Status Icon */}
                                        {
                                            userStatus === "online" && (
                                                <div className="absolute right-0 bottom-0">
                                                    <div className="size-4 border-2 border-white rounded-full bg-green-500"></div>
                                                </div>
                                            )
                                        }

                                    </div>
                                ) : (
                                    <div className="size-20 rounded-full overflow-hidden" key={`${p._id}`}>
                                        <AvatarImage chatPhotoUrl={p?.profilePicture?.url} />
                                    </div>
                                );

                                return displayPhotos;
                            })}
                        </div>

                        {/* Display Names */}
                        <div className="flex flex-col justify-center items-center gap-2">
                            <div className="flex flex-col justify-center items-center gap-1">
                                {isGroup ? activeChatData?.chatName ? activeChatData.chatName : (
                                    <div className="font-semibold text-md">
                                        {otherUser?.map(u => u.firstName).join(", ")}
                                    </div>
                                ) : (
                                    <div className="font-normal text-md text-blue-500">
                                        {activeChatData?.nicknames[otherUser._id] || otherUser?.fullName}
                                    </div>
                                )}

                                {!isGroup && (
                                    <div className='text-xs'>
                                        @{otherUser?.userName}
                                    </div>
                                )}
                            </div>

                            <div className='text-gray-400 text-xs font-light'>
                                {userStatus === "online" ? "Active Now" : ""}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Settings Menu */}
                <div className='w-full'>

                    {/* Customize Chat Start */}
                    <div
                        className='flex justify-between w-full items-center rounded-md p-2 hover:bg-gray-100 active:bg-gray-200'
                        onClick={() => setIsCustomizeChatExpanded(prev => !prev)}
                    >
                        <div className='text-sm font-semibold'>
                            Customize Chat
                        </div>
                        <div className='text-3xl'>
                            {isCustomizeChatExpanded ? <RxCaretDown /> : <RxCaretRight />}
                        </div>
                    </div>

                    {isCustomizeChatExpanded && (
                        <div className=''>
                            {/* Chat Name Edit */}
                            {isGroup && (
                                <>
                                    <div
                                        className='flex justify-between w-full items-center rounded-md p-2 hover:bg-gray-100 active:bg-gray-200 text-sm'
                                        onClick={() => setIsChatNameEditModalDisplayed(prev => !prev)}
                                    >
                                        <div className='flex gap-2 items-center justify-center'>
                                            <div className='size-8 rounded-full flex justify-center items-center bg-gray-200 font-semibold'><MdModeEdit /></div>
                                            Change chat name
                                        </div>
                                    </div>

                                    <CenterPopUpModal open={isChatNameEditModalDisplayed} onClose={() => setIsChatNameEditModalDisplayed(false)}>
                                        <div className='p-5 w-[550px] flex flex-col gap-5'>
                                            <div className='flex justify-between items-center'>
                                                <div></div>
                                                <div className='font-medium pl-6'>Change chat name</div>
                                                <div className='size-7 rounded-full bg-gray-100 text-[12px] font-bold flex justify-center items-center'
                                                    onClick={() => setIsChatNameEditModalDisplayed(false)}>X</div>
                                            </div>

                                            <div className='flex flex-col gap-4'>
                                                <div className='w-full text-xs'>Changing the name of a group chat changes it for everyone.</div>
                                                <div className='w-full relative'>
                                                    <div className='w-full text-xs absolute px-4 pt-2'>
                                                        <div className='text-blue-500'>
                                                            Chat name
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        className='border w-full border-gray-300 rounded-sm py-2 px-4 pt-6'
                                                        value={chatName}
                                                        onChange={(e) => setChatName(e.target.value)}
                                                    />
                                                </div>
                                                <div className='w-full flex gap-2'>
                                                    <button onClick={() => setIsChatNameEditModalDisplayed(false)} type='button' className='rounded-md text-sm font-medium w-1/2 px-2 py-1 bg-gray-100'>Cancel</button>
                                                    <button
                                                        type='button'
                                                        className={`rounded-md text-sm font-medium w-1/2 px-2 py-1 bg-gray-100 ${chatName === activeChatData.chatName && "text-gray-300"}`}
                                                        disabled={chatName === activeChatData.chatName}
                                                        onClick={handleChatNameUpdate}
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </CenterPopUpModal >
                                </>
                            )}

                            <div
                                className='flex justify-between w-full items-center rounded-md p-2 hover:bg-gray-100 active:bg-gray-200 text-sm'
                                onClick={() => setIsNicknameEditModalDisplayed(prev => !prev)}
                            >
                                <div className='flex gap-2 items-center justify-center'>
                                    <div className='size-8 rounded-full flex justify-center items-center bg-gray-200 font-semibold'>Aa</div>
                                    Edit Nicknames
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Nickname edit form */}
                    <CenterPopUpModal open={isNicknameEditModalDisplayed} onClose={() => setIsNicknameEditModalDisplayed(false)}>
                        <div className='p-5 w-[550px] flex flex-col gap-5'>
                            <div className='flex justify-between items-center'>
                                <div></div>
                                <div className='font-medium pl-6'>Nicknames</div>
                                <div className='size-7 rounded-full bg-gray-100 text-[12px] font-bold flex justify-center items-center'
                                    onClick={() => setIsNicknameEditModalDisplayed(false)}>X</div>
                            </div>

                            <div>
                                {activeChatData?.participants.map((p) => {
                                    const isEditing = editingParticipantId === p._id;

                                    return (
                                        <div
                                            key={p._id}
                                            className="w-full rounded-md hover:bg-gray-50 px-2 py-4"
                                        >
                                            <div className="flex items-center gap-3">

                                                {/* Avatar */}
                                                <div className="size-10 rounded-full overflow-hidden flex-shrink-0">
                                                    <AvatarImage chatPhotoUrl={p?.profilePicture?.url} />
                                                </div>

                                                {/* Name / Input */}
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={updatedNickname[p._id] ?? activeChatData.nicknames[p._id]}
                                                        placeholder={p.fullName}
                                                        className="flex-1 border border-gray-300 rounded-md p-2 text-sm"
                                                        autoFocus
                                                        onChange={(e) =>
                                                            setUpdatedNickname(prev => ({
                                                                ...prev,
                                                                [p._id]: e.target.value,
                                                            }))
                                                        }
                                                    />
                                                ) : (
                                                    <div className="flex-1 flex flex-col">
                                                        <div className="text-sm font-medium">
                                                            {p.fullName}
                                                        </div>
                                                        <div className="text-xs font-light text-gray-500">
                                                            {activeChatData?.nicknames[p._id] || "Set nickname"}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Action */}
                                                {isEditing ? (
                                                    <button
                                                        className="size-10 text-2xl rounded-full hover:bg-gray-100 flex items-center justify-center"
                                                        onClick={handleNicknameEdit}
                                                    >
                                                        <IoMdCheckmark />
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="size-10 text-2xl rounded-full hover:bg-gray-100 flex items-center justify-center"
                                                        onClick={() => setEditingParticipantId(p._id)}
                                                    >
                                                        <RiEdit2Fill />
                                                    </button>
                                                )}

                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </CenterPopUpModal >
                    {/* Customize Chat End */}

                    <div
                        className='flex justify-between w-full items-center rounded-md p-2 hover:bg-gray-100 active:bg-gray-200'
                        onClick={() => setIsChatMembersExpanded(prev => !prev)}
                    >
                        <div className='text-sm font-semibold'>
                            Chat Members
                        </div>
                        <div className='text-3xl'>
                            {isChatMembersExpanded ? <RxCaretDown /> : <RxCaretRight />}
                        </div>
                    </div>

                    {isChatMembersExpanded && (
                        <>
                            {
                                activeChatData?.participants.map((participant) => {
                                    return (
                                        <div
                                            key={participant._id}
                                            className='flex justify-between flex-col gap-2 w-full items-center rounded-md p-2 hover:bg-gray-100 active:bg-gray-200 text-sm'
                                        >
                                            <div className='flex gap-2 items-center w-full justify-start h-12'>
                                                <div className='size-10 rounded-full overflow-hidden flex justify-center items-center'>
                                                    <AvatarImage chatPhotoUrl={participant?.profilePicture?.url} />
                                                </div>
                                                <div>
                                                    <div className='font-medium'>
                                                        {participant.fullName}
                                                    </div>
                                                    <div className='text-xs text-gray-500'>
                                                        @{participant.userName}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                    )
                                })
                            }
                        </>
                    )}

                    <div className='mt-4 border-t border-gray-200 pt-3'>
                        <button
                            type='button'
                            onClick={() => setIsDeleteChatModalDisplayed(true)}
                            disabled={isDeletingChat}
                            className='w-full rounded-md p-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed'
                        >
                            {isDeletingChat ? "Deleting..." : "Delete Chat"}
                        </button>
                    </div>

                    <CenterPopUpModal
                        open={isDeleteChatModalDisplayed}
                        onClose={() => setIsDeleteChatModalDisplayed(false)}
                    >
                        <div className='p-5 w-[420px] flex flex-col gap-4'>
                            <div className='flex justify-between items-center'>
                                <div className='font-medium'>Delete Chat</div>
                                <button
                                    type='button'
                                    className='size-7 rounded-full bg-gray-100 text-[12px] font-bold flex justify-center items-center'
                                    onClick={() => setIsDeleteChatModalDisplayed(false)}
                                    disabled={isDeletingChat}
                                >
                                    X
                                </button>
                            </div>

                            <div className='text-sm text-gray-600'>
                                This will remove the chat from your account. You can restore it later by messaging the user again.
                            </div>

                            <div className='w-full flex gap-2 pt-1'>
                                <button
                                    type='button'
                                    onClick={() => setIsDeleteChatModalDisplayed(false)}
                                    disabled={isDeletingChat}
                                    className='rounded-md text-sm font-medium w-1/2 px-2 py-2 bg-gray-100 disabled:opacity-60'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='button'
                                    onClick={handleDeleteChat}
                                    disabled={isDeletingChat}
                                    className='rounded-md text-sm font-medium w-1/2 px-2 py-2 bg-red-500 text-white disabled:opacity-60'
                                >
                                    {isDeletingChat ? "Deleting..." : "Delete"}
                                </button>
                            </div>
                        </div>
                    </CenterPopUpModal>
                </div>
            </div>
        </div>
    )
}

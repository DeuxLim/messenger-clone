import { getOtherParticipant, getOtherParticipants } from '../../../utilities/utils';
import AvatarImage from '../global/AvatarImage';
import useOtherParticipants from '../../../hooks/chat/useOtherParticipants';
import useAuth from '../../../contexts/auth/useAuth';
import useChatSession from '../../../contexts/chat/ChatSession/useChatSession';

export default function ChatDetailsPanel() {
    const { activeChatData } = useChatSession();
    const { currentUser } = useAuth();
    const chatParticipants = useOtherParticipants(activeChatData, currentUser._id);

    const isGroup = activeChatData?.isGroup;
    const otherUser = !isGroup
        ? getOtherParticipant(activeChatData?.participants, currentUser?._id)
        : getOtherParticipants(activeChatData?.participants, currentUser?._id);

    return (
        <div className="flex justify-center items-center mt-4 flex-col gap-4 ">
            <div className='flex flex-col justify-center items-center'>

                {/* Display Photo */}
                <div className={`flex justify-center items-center relative`}>
                    {activeChatData?.participants?.length > 2 && (
                        <div className='size-20'>
                        </div>
                    )}
                    {chatParticipants?.map((p, index) => {
                        const displayPhotos = isGroup ? (
                            <div
                                key={p?._id}
                                className={`absolute ${index === 0 ? 'right-1.5 top-2' : 'left-1.5 bottom-2'}`}
                            >
                                <div className="size-12 rounded-full overflow-hidden">
                                    <AvatarImage chatPhotoUrl={p?.profilePicture?.url} />
                                </div>
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
                    <div className="flex flex-col justify-center items-center">
                        {isGroup ? activeChatData?.chatName ? activeChatData.chatName : (
                            <div className="font-semibold text-md">
                                {otherUser.map(u => u.firstName).join(", ")}
                            </div>
                        ) : (
                            <div className="font-semibold text-2xl">
                                {otherUser?.fullName}
                            </div>
                        )}
                    </div>

                    {!isGroup && (
                        <div>
                            @{otherUser?.userName}
                        </div>
                    )}

                    {/* {!isGroup && (
                        <div className="flex justify-center items-center">
                            <button type="button" className="py-2 px-2 text-xs bg-gray-300 flex justify-center items-center rounded-full font-semibold">
                                View Profile
                            </button>
                        </div>
                    )} */}
                </div>

            </div>
        </div >
    )
}

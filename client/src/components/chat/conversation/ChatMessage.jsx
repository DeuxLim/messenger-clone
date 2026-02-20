import useAuth from "../../../contexts/auth/useAuth";
import useToggle from "../../../hooks/common/useToggle";
import { formatLastMessageDateTime, isEmpty, isEmojiOnly } from "../../../utilities/utils";
import AvatarImage from "../global/AvatarImage";

export default function ChatMessage({
    data,
    prevMsg,
    nextMsg,
    isLastMessage = false,
    nicknames = {},
}) {
    const { currentUser } = useAuth();
    const [messageClicked, setMessageClicked] = useToggle(false);

    const emojiOnly = isEmojiOnly(data.text);

    const isSender = data.sender?._id === currentUser?._id;

    // --- Grouping and avatar logic ---
    const MESSAGE_GROUPING_INTERVAL = 5; // minutes
    const MESSAGE_GROUPING_LONG_INTERVAL = 180; // minutes

    const getMinutesDiff = (a, b) => {
        if (!a || !b) return Infinity;
        return Math.abs(new Date(a) - new Date(b)) / 1000 / 60;
    };

    const minutesDiffFromLast = getMinutesDiff(data?.createdAt, prevMsg?.createdAt);
    const timeGapFromLast = minutesDiffFromLast > MESSAGE_GROUPING_INTERVAL;
    const longTimeGapFromLast = minutesDiffFromLast > MESSAGE_GROUPING_LONG_INTERVAL;
    const sameSenderAsLast = prevMsg && data.sender?._id === prevMsg.sender?._id;
    const isNewGroup = !sameSenderAsLast || timeGapFromLast;

    const minutesDiffToNext = getMinutesDiff(nextMsg?.createdAt, data?.createdAt);
    const sameSenderAsNext = nextMsg && data.sender?._id === nextMsg.sender?._id;
    const longGapToNext = minutesDiffToNext > MESSAGE_GROUPING_INTERVAL;
    const showAvatar = !nextMsg || !sameSenderAsNext || longGapToNext;

    const sentMessageStatus = (() => {
        if (data.status === "sending") return "sending";
        if (data.status === "failed") return "failed";
        if (data.isSeen) return "seen";
        return "sent";
    })();

    // --- Message bubbles ---
    if (!isSender) {
        // Inbound message
        return (
            <>
                {longTimeGapFromLast && (
                    <div className="flex justify-center text-gray-400 text-xs pt-8">
                        {formatLastMessageDateTime(data.createdAt)}
                    </div>
                )}
                {!isEmpty(data.text) && (
                    <div className={`flex text-sm ${isNewGroup ? "mt-3" : ""}`}>
                        <div className="flex gap-2 items-end w-full">
                            <div className="w-7 h-7 flex-shrink-0 flex justify-center items-end">
                                {showAvatar && isEmpty(data.media) && (
                                    <div className="w-7 h-7 rounded-full overflow-hidden">
                                        <AvatarImage chatPhotoUrl={data?.sender?.profilePicture?.url} />
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col max-w-2/3 gap-0.5">
                                {isNewGroup || longTimeGapFromLast && <div className="px-3 text-xs text-gray-500">{nicknames[data?.sender?._id] || data.sender.firstName}</div>}
                                <div
                                    id={`msg-${data?._id}`}
                                    data-seen={data.isSeen}
                                    className={emojiOnly
                                        ? "text-5xl leading-none select-none"
                                        : `border border-gray-200 px-3 py-1.5 bg-gray-200 break-words 
                                    ${isNewGroup ? "rounded-tl-3xl rounded-tr-3xl rounded-bl-sm rounded-br-3xl" : "rounded-tl-md rounded-tr-2xl rounded-bl-md rounded-br-2xl"}`}>
                                    {data.text}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Photo and Video */}
                {!isEmpty(data.media) && (
                    <div className={`flex text-sm ${isNewGroup ? "mt-3" : ""}`}>
                        {(() => {
                            return data.media.map((media) => {
                                if (media.type === "image") {
                                    return (
                                        <div className="flex gap-2 items-end w-full" key={media.publicId}>
                                            <div className="w-7 h-7 flex-shrink-0 flex justify-center items-end" key={media.publicId}>
                                                {showAvatar && (
                                                    <div className="w-7 h-7 rounded-full overflow-hidden">
                                                        <AvatarImage chatPhotoUrl={data?.sender?.profilePicture?.url} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="rounded-lg overflow-hidden max-w-56 max-h-80">
                                                <img
                                                    src={media.url}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>
                                    )
                                } else if (media.type === "video") {
                                    return (
                                        <div className="flex gap-2 items-end w-full">
                                            <div className="w-7 h-7 flex-shrink-0 flex justify-center items-end" key={media.publicId}>
                                                {showAvatar && (
                                                    <div className="w-7 h-7 rounded-full overflow-hidden">
                                                        <AvatarImage chatPhotoUrl={data?.sender?.profilePicture?.url} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="rounded-lg overflow-hidden max-w-56 max-h-80" key={media.publicId}>
                                                <video
                                                    src={media.url}
                                                    controls
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>
                                    )
                                }

                            });
                        })()}
                    </div>
                )}
            </>
        );
    }

    // Outbound message
    return (
        <>
            {longTimeGapFromLast && (
                <div className="flex justify-center text-gray-400 text-xs pt-8">
                    {formatLastMessageDateTime(data.createdAt)}
                </div>
            )}
            {!isEmpty(data.text) && (
                <div className={`flex flex-col items-end text-sm ${isNewGroup ? "mt-3" : ""} pr-2.5`}>
                    <div className="flex flex-col gap-1 items-end w-full" onClick={setMessageClicked}>

                        <div
                            id={`msg-${data?._id}`}
                            data-seen={data.isSeen}
                            className={
                                emojiOnly
                                    ? "text-5xl leading-none select-none"
                                    : `bg-blue-500 text-white px-4 py-1.5 max-w-2/3 break-words ${isNewGroup && longTimeGapFromLast
                                        ? "rounded-tl-3xl rounded-tr-3xl rounded-bl-3xl rounded-br-sm"
                                        : "rounded-tl-2xl rounded-tr-md rounded-bl-2xl rounded-br-md"}`
                            }
                        >
                            {data.text}
                        </div>
                    </div>

                    {(
                        sentMessageStatus === "sending" ||
                        messageClicked ||
                        isLastMessage
                    ) && (
                            <div className="flex justify-end items-center text-xs text-gray-400 mt-0.5">
                                <span>{sentMessageStatus}</span>
                            </div>
                        )}
                </div>
            )}

            {/* Photo and Video */}
            {!isEmpty(data.media) && (
                <div className={`flex flex-col items-end text-sm ${isNewGroup ? "mt-3" : ""} pr-2.5`}>
                    {(() => {
                        return data.media.map((media) => {
                            if (media.type?.toLowerCase().includes("image")) {
                                return (
                                    <div className="rounded-lg overflow-hidden max-w-56 max-h-80" key={media.publicId ?? media.id}>
                                        <img
                                            src={media.url ?? media.previewUrl}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )
                            } else if (media.type?.toLowerCase().includes("video")) {
                                return (
                                    <div className="rounded-lg overflow-hidden max-w-56 max-h-80" key={media.publicId ?? media.id}>
                                        <video
                                            src={media.url ?? media.previewUrl}
                                            controls
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )
                            }

                        });
                    })()}

                    {(
                        sentMessageStatus === "sending" ||
                        messageClicked ||
                        isLastMessage
                    ) && (
                            <div className="flex justify-end items-center text-xs text-gray-400 mt-0.5">
                                <span>{sentMessageStatus}</span>
                            </div>
                        )}
                </div>
            )}
        </>
    );
}

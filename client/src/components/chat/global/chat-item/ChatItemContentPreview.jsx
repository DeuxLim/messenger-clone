
import { formatSystemMessage } from "../../../../utilities/systemMessages";

export default function ChatItemContentPreview({ data }) {
    const {
        typingChats,
        chatData,
        isLastMsgSeen,
        currentUser,
        lastMessageSender,
        lastMessageDateTime
    } = data;

    const systemPreview = formatSystemMessage({
        message: chatData?.lastMessage,
        currentUserId: currentUser?._id,
        participants: chatData?.participants || [],
    });

    const unread = chatData?.lastMessage?.type === "system" ?
        `${chatData?.unreadCount} chat updates` :
        (chatData?.unreadCount > 0) ?
            `${chatData?.lastMessage?.sender?.firstName} sent ${chatData?.unreadCount} message${chatData?.unreadCount > 1 ? "s" : ""}` : "";

    const mediaUrl = chatData?.lastMessage?.media[0]?.url;
    const mediaType = chatData?.lastMessage?.media[0]?.type;
    const article = /^[aeiou]/i.test(mediaType) ? 'an' : 'a';
    const mediaMessagePreview = `${lastMessageSender} sent ${article} ${mediaType}`;
    const messagePreview = `${lastMessageSender} sent a message`;

    return (
        <>
            {typingChats[chatData._id] ? (
                <div className="text-xs text-gray-600">
                    Typing ...
                </div>
            ) : (
                <div className="flex gap-1">
                    <div className="flex items-center gap-2 text-xs text-gray-600 min-w-0">
                        <span className={`truncate flex-1 ${!isLastMsgSeen && chatData.lastMessage?.sender?._id !== currentUser._id ? "font-bold" : ""}`}>
                            {chatData.lastMessage?.status === "sending" ? (
                                "sending..."
                            ) : chatData.lastMessage?.type === "system" ? (
                                systemPreview
                            ) : chatData.lastMessage?.sender?._id === currentUser._id ? (
                                `you: ${chatData.lastMessage?.text || ""}`
                            ) : chatData.unreadCount > 0 && !isLastMsgSeen ? (
                                unread
                            ) : !isLastMsgSeen && lastMessageSender ?
                                (mediaUrl) ? mediaMessagePreview : messagePreview
                                : (
                                    chatData.lastMessage?.text || ""
                                )}
                        </span>

                    </div>
                    <span className="text-gray-500 whitespace-nowrap flex-shrink-0 text-xs">
                        {lastMessageDateTime && `• ${lastMessageDateTime}`}
                    </span>
                </div>
            )}
        </>
    )
}

import ChatApp from "../pages/ChatApp";
import ActiveChatProvider from "../contexts/chat/ActiveChat/ActiveChatProvider";
import ChatDisplayProvider from "../contexts/chat/ChatDisplay/ChatDisplayProvider";
import ChatProvider from "../contexts/chat/ChatProvider";

export default function ChatsAppShell() {
    return (
        <ChatProvider>
            <ChatDisplayProvider>
                <ActiveChatProvider>
                    <ChatApp />
                </ActiveChatProvider>
            </ChatDisplayProvider>
        </ChatProvider>
    );
}

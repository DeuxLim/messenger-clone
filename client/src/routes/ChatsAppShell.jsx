import ChatApp from "../pages/ChatApp";
import ActiveChatProvider from "../contexts/chat/ActiveChat/ActiveChatProvider";
import ChatDisplayProvider from "../contexts/chat/ChatDisplay/ChatDisplayProvider";
import ChatProvider from "../contexts/chat/ChatProvider";
import ChatPresenceProvider from "../contexts/chat/ChatPresence/ChatPresenceProvider";

export default function ChatsAppShell() {
    return (
        <ChatPresenceProvider>
            <ChatProvider>
                <ChatDisplayProvider>
                    <ActiveChatProvider>
                        <ChatApp />
                    </ActiveChatProvider>
                </ChatDisplayProvider>
            </ChatProvider>
        </ChatPresenceProvider>
    );
}

import ChatApp from "../pages/ChatApp";
import ActiveChatProvider from "../contexts/chat/ActiveChat/ActiveChatProvider";
import ChatDisplayProvider from "../contexts/chat/ChatDisplay/ChatDisplayProvider";
import ChatProvider from "../contexts/chat/ChatProvider";
import ChatPresenceProvider from "../contexts/chat/ChatPresence/ChatPresenceProvider";
import ChatRealtimeProvider from "../contexts/chat/ChatRealtime/ChatRealtimeProvider";
import ChatSearchProvider from "../contexts/chat/ChatSearch/ChatSearchProvider";

export default function ChatsAppShell() {
    return (
        <ChatPresenceProvider>
            <ChatSearchProvider>
                <ChatProvider>
                    <ChatRealtimeProvider>
                        <ChatDisplayProvider>
                            <ActiveChatProvider>
                                <ChatApp />
                            </ActiveChatProvider>
                        </ChatDisplayProvider>
                    </ChatRealtimeProvider>
                </ChatProvider>
            </ChatSearchProvider>
        </ChatPresenceProvider>
    );
}

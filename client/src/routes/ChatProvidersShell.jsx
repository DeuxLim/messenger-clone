import { Outlet } from "react-router";
import ActiveChatProvider from "../contexts/chat/ActiveChat/ActiveChatProvider";
import ChatDisplayProvider from "../contexts/chat/ChatDisplay/ChatDisplayProvider";
import ChatPresenceProvider from "../contexts/chat/ChatPresence/ChatPresenceProvider";
import ChatRealtimeProvider from "../contexts/chat/ChatRealtime/ChatRealtimeProvider";
import ChatSearchProvider from "../contexts/chat/ChatSearch/ChatSearchProvider";
import ChatDataProvider from "../contexts/chat/ChatData/ChatDataProvider";
import ChatSessionProvider from "../contexts/chat/ChatSession/ChatSessionProvider";

export default function ChatProvidersShell() {
    return (
        <ChatPresenceProvider>
            <ChatSearchProvider>
                <ChatDataProvider>
                    <ChatSessionProvider>
                        <ChatRealtimeProvider>
                            <ChatDisplayProvider>
                                <ActiveChatProvider>
                                    <Outlet />
                                </ActiveChatProvider>
                            </ChatDisplayProvider>
                        </ChatRealtimeProvider>
                    </ChatSessionProvider>
                </ChatDataProvider>
            </ChatSearchProvider>
        </ChatPresenceProvider>
    );
}

import { Outlet } from "react-router";
import useChatDisplay from "../../contexts/chat/ChatDisplay/useChatDisplay";
import useAuth from "../../contexts/auth/useAuth";
import useSocket from "../../contexts/socket/useSocket";
import useChatData from "../../contexts/chat/ChatData/useChatData";

export default function MainWindow() {
    const { isChatSettingsOpen, isDesktop } = useChatDisplay();
    const { authStatus } = useAuth();
    const { isLoading } = useChatData();
    const { socketStatus } = useSocket();

    const isAppReady =
        authStatus === "authenticated" &&
        socketStatus === "connected";

    if (!isAppReady || isLoading) return "";

    return (
        <>
            {(isDesktop || (!isDesktop && !isChatSettingsOpen)) && (
                <main className="flex-1 h-full shadow-sm overflow-hidden bg-white rounded-xl w-full">
                    <Outlet />
                </main>
            )}
        </>
    );
}

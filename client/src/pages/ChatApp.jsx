import { Outlet, useLocation } from "react-router";
import Sidebar from "../components/chat/Sidebar";
import ChatSettings from "../components/chat/conversation/ChatSettings";
import IconMenu from "../components/chat/icon-menu/IconMenu";
import { useState } from "react";
import { isEmpty } from "../utilities/utils";
import useAuth from "../contexts/auth/useAuth";
import useChatDisplay from "../contexts/chat/ChatDisplay/useChatDisplay";
import { resendVerificationService } from "../services/auth.service";
import useToast from "../contexts/ui/useToast";
import { getErrorMessage } from "../utilities/errors";

export default function ChatApp() {
    const { sidebarVisible, isDesktop, isChatSettingsOpen } = useChatDisplay();
    const { currentUser } = useAuth();
    const toast = useToast();
    const location = useLocation();
    const isRoot = location.pathname === "/chats";
    const isMobileBottomNavRoute = location.pathname === "/chats" || location.pathname === "/chats/new";

    const [resendMessage, setResendMessage] = useState(null);
    const [resendSuccess, setResendSuccess] = useState(null);
    const [isResending, setIsResending] = useState(false);

    const handleResend = async () => {
        if (!currentUser?.email || isResending) return;

        setIsResending(true);
        setResendMessage(null);
        setResendSuccess(null);

        try {
            const { message } = await resendVerificationService(currentUser.email);

            setResendSuccess(true);
            setResendMessage(message);
        } catch (err) {
            toast.error(getErrorMessage(err, "Failed to resend verification email."));
            setResendSuccess(false);
            setResendMessage("Failed to resend verification email.");
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-gray-100 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
            <div className="w-full">
                {currentUser && !currentUser?.isVerified && (
                    <div className="w-full bg-blue-500 flex items-center justify-center p-2 gap-4 h-12">
                        <div className="text-white text-xs md:text-md">
                            Your email isn't verified yet. Please check your inbox.
                        </div>
                        <button
                            type="button"
                            className="border text-white rounded-md px-4 py-1 text-xs md:text-md hover:bg-blue-400 hover:border-0 disabled:opacity-50"
                            onClick={handleResend}
                            disabled={isResending}
                        >
                            {isResending ? "Sending..." : "Resend verification link"}
                        </button>
                    </div>
                )}

                {!isEmpty(resendMessage) && (
                    <div
                        className={`w-full ${resendSuccess ? "bg-green-400" : "bg-red-400"
                            } text-xs flex justify-center items-center py-1`}
                    >
                        {resendMessage}
                    </div>
                )}
            </div>
            <div className={`relative flex h-full px-2 pt-4 ${!isDesktop && isMobileBottomNavRoute ? "pb-24" : "pb-4"} md:py-4 md:pb-4 bg-gray-100 dark:bg-gray-950 gap-4`}>

                <IconMenu />

                {isDesktop
                    ? (
                        <>
                            {sidebarVisible && <Sidebar />}
                            <Outlet />
                        </>
                    )
                    : (
                        isRoot
                            ? sidebarVisible && <Sidebar />
                            : <Outlet />
                    )
                }

                {isChatSettingsOpen && <ChatSettings />}
            </div>
        </div>
    );
}

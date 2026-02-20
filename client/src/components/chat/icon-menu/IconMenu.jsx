import { BiFoodMenu } from "react-icons/bi";
import ChatItemAvatar from "../global/chat-item/ChatItemAvatar";
import { TbMessageCircleFilled } from "react-icons/tb";
import { CgProfile } from "react-icons/cg";
import useToggle from "../../../hooks/common/useToggle";
import useDropdownMenu from "../../../hooks/common/useDropdownMenu";
import { TbLogout } from "react-icons/tb";
import { Link, useLocation } from "react-router";
import IconMenuSkeleton from "./IconMenuSkeleton";
import useAuth from "../../../contexts/auth/useAuth";
import useSocket from "../../../contexts/socket/useSocket";
import ThemeToggle from "../../common/ThemeToggle";

export default function IconMenu() {
    const [isIconMenuExpanded, setIsIconMenuExpanded] = useToggle(false);
    const { currentUser, logout, authStatus } = useAuth();
    const { socketStatus } = useSocket();
    const { isOpen, toggle, close, buttonRef, menuRef } = useDropdownMenu();

    const isAppReady =
        authStatus === "authenticated" &&
        socketStatus === "connected";

    const handleLogout = () => {
        logout();
        close();
    };

    const location = useLocation();
    const isChatsPage = location.pathname.startsWith("/chats/");

    // ✅ Skeleton state
    if (!isAppReady) {
        return <IconMenuSkeleton expanded={isIconMenuExpanded} />;
    }

    return (
        <div className="flex justify-center items-center flex-col pl-2">

            {/* Menu Items */}
            <div className="flex-1 flex flex-col">
                {/* Chats Menu */}
                <div className={`${isChatsPage && "bg-gray-200 dark:bg-gray-700 rounded-lg"} flex justify-center items-center w-full gap-2.5 px-2.5 py-2.5`}>
                    <TbMessageCircleFilled className="text-2xl" />
                    {isIconMenuExpanded && <div className="flex-1 text-sm  w-46">Chats</div>}
                </div>
                {!isIconMenuExpanded && <div className="w-[90%] h-2 border-b border-gray-300"></div>}
            </div>

            {/* User Settings */}
            <div className={`flex gap-1 items-center justify-center max-h-20 w-full ${!isIconMenuExpanded && "flex-col"}`}>
                <div
                    className="flex-1 flex justify-start items-center gap-2 relative"
                    ref={buttonRef}
                    onClick={toggle}
                    aria-expanded={isOpen}
                >
                    <ChatItemAvatar data={{ chatPhotoUrl: currentUser?.profilePicture?.url, containerClass: "size-8" }} />
                    {isIconMenuExpanded && (
                        <div className="flex flex-col text-xs py-0.5">
                            <div className="text-sm">{currentUser.fullName}</div>
                            <div className="text-gray-500">{currentUser.userName}</div>
                        </div>
                    )}

                    {/* Dropdown menu */}
                    {isOpen && (
                        <div
                            id="sidebar-settings-menu"
                            ref={menuRef}
                            role="menu"
                            aria-labelledby="sidebar-settings-button"
                            className="absolute bottom-12 left-0 rounded-xl shadow-lg border border-gray-200 z-50 bg-white p-1 w-80"
                        >
                            {/* Profile */}
                            <Link to="/profile">
                                <button
                                    type="button"
                                    className="w-full text-left p-2 hover:bg-gray-100 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                >
                                    <span className="size-8 bg-gray-100 rounded-full flex justify-center items-center">
                                        <CgProfile className="text-xl" />
                                    </span>
                                    <span className="text-sm">Profile</span>
                                </button>
                            </Link>

                            {/* Log out */}
                            <button
                                type="button"
                                role="menuitem"
                                onClick={handleLogout}
                                className="w-full text-left p-2 hover:bg-gray-100 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            >
                                <span className="size-8 bg-gray-100 rounded-full flex justify-center items-center">
                                    <TbLogout className="text-lg" />
                                </span>
                                <span className="text-sm">Log out</span>
                            </button>

                            <div className="p-2">
                                <ThemeToggle className="w-full justify-center" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Toggle Menu */}
                <button onClick={setIsIconMenuExpanded} className="size-9 rounded-full bg-gray-200 dark:bg-gray-700 md:flex justify-center items-center hidden">
                    <BiFoodMenu className="text-xl" />
                </button>
            </div>
        </div>
    )
}

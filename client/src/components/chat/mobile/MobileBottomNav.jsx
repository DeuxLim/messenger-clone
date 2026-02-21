import { Link, useLocation } from "react-router";
import { TbMessageCircleFilled, TbLogout, TbDots } from "react-icons/tb";
import { MdOutlinePersonOutline } from "react-icons/md";
import { LuSquarePen } from "react-icons/lu";
import useDropdownMenu from "../../../hooks/common/useDropdownMenu";
import useAuth from "../../../contexts/auth/useAuth";
import useSocket from "../../../contexts/socket/useSocket";
import ThemeToggle from "../../common/ThemeToggle";

export default function MobileBottomNav() {
    const location = useLocation();
    const { pathname } = location;
    const { currentUser, logout, authStatus } = useAuth();
    const { socketStatus } = useSocket();
    const { isOpen, toggle, close, buttonRef, menuRef } = useDropdownMenu();

    const isAppReady =
        authStatus === "authenticated" &&
        socketStatus === "connected";

    const isChatsPage = pathname === "/chats";
    const isNewChatPage = pathname === "/chats/new";
    const isProfilePage = pathname === "/profile";
    const shouldShowNav = isChatsPage || isNewChatPage || isProfilePage;

    const itemClass = (isActive) =>
        `group flex flex-col items-center justify-center gap-1 flex-1 py-1 rounded-2xl transition ${isActive
            ? "text-blue-600 dark:text-blue-400"
            : "text-gray-500 dark:text-gray-300"
        }`;

    const iconWrapClass = (isActive) =>
        `size-10 rounded-full flex items-center justify-center transition ${isActive
            ? "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300"
            : "text-gray-500 dark:text-gray-300 group-active:scale-95"
        }`;

    if (!isAppReady || !shouldShowNav) return null;

    return (
        <nav className="fixed bottom-0 inset-x-0 md:hidden z-50 border-t border-gray-200/90 dark:border-gray-700/80 bg-white/95 dark:bg-gray-900/95 backdrop-blur">
            <div className="relative flex items-center gap-1 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
                <Link to="/chats" className={itemClass(isChatsPage)}>
                    <span className={iconWrapClass(isChatsPage)}>
                        <TbMessageCircleFilled className="text-[1.5rem]" />
                    </span>
                    <span className={`text-xs ${isChatsPage ? "font-medium" : ""}`}>Chats</span>
                </Link>

                <Link to="/chats/new" className={itemClass(isNewChatPage)}>
                    <span className={iconWrapClass(isNewChatPage)}>
                        <LuSquarePen className="text-[1.3rem]" />
                    </span>
                    <span className={`text-xs ${isNewChatPage ? "font-medium" : ""}`}>New</span>
                </Link>

                <Link to="/profile" className={itemClass(isProfilePage)}>
                    <span className={iconWrapClass(isProfilePage)}>
                        <MdOutlinePersonOutline className="text-[1.65rem]" />
                    </span>
                    <span className={`text-xs ${isProfilePage ? "font-medium" : ""}`}>Profile</span>
                </Link>

                <button
                    type="button"
                    className={itemClass(isOpen)}
                    ref={buttonRef}
                    onClick={toggle}
                    aria-haspopup="menu"
                    aria-expanded={isOpen}
                    aria-controls="mobile-bottom-menu"
                >
                    <span className={iconWrapClass(isOpen)}>
                        <TbDots className="text-[1.5rem]" />
                    </span>
                    <span className={`text-xs ${isOpen ? "font-medium" : ""}`}>More</span>
                </button>

                {isOpen && (
                    <div
                        id="mobile-bottom-menu"
                        ref={menuRef}
                        role="menu"
                        className="absolute right-2 bottom-[calc(100%+0.5rem)] w-56 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 bg-white dark:bg-gray-900 p-2"
                    >
                        <div className="px-2 pb-2 text-xs text-gray-500 dark:text-gray-400 truncate">
                            {currentUser?.fullName}
                        </div>
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                logout();
                                close();
                            }}
                            className="w-full text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                        >
                            <TbLogout className="text-lg" />
                            <span className="text-sm">Log out</span>
                        </button>
                        <div className="pt-2">
                            <ThemeToggle className="w-full justify-center" compact />
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}

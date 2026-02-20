import { TbSearch } from "react-icons/tb";
import useDebounceSearch from "../../../hooks/common/useDebounceSearch";
import SidebarSearchSkeleton from "./SidebarSearchSkeleton";
import useAuth from "../../../contexts/auth/useAuth";
import useSocket from "../../../contexts/socket/useSocket";
import { searchChatAndUsers } from "../../../services/chats.service";
import { useEffect, useRef } from "react";
import useChatData from "../../../contexts/chat/ChatData/useChatData";
import useChatSearch from "../../../contexts/chat/ChatSearch/useChatSearch";
import useChatSession from "../../../contexts/chat/ChatSession/useChatSession";

export default function SidebarSearch() {
    const { updateChatSearchResults } = useChatSearch();
    const { isLoading } = useChatData();
    const { activeChatData } = useChatSession();
    const { authStatus } = useAuth();
    const { socketStatus } = useSocket();

    const isAppReady =
        authStatus === "authenticated" &&
        socketStatus === "connected";

    /* Handle chat query logic */
    const handleChatSearch = async (value) => {
        const searchQuery = value.trim();
        if (!searchQuery) {
            return updateChatSearchResults({ isSearch: false })
        }

        try {
            const response = await searchChatAndUsers(searchQuery);
            updateChatSearchResults({
                chats: [...response.existingChats, ...response.groupChats],
                users: response.newUsers,
                isSearch: true,
            });
        } catch (error) {
            console.error("Error searching chats:", error);
        }
    };

    const { query, handleChange, reset } = useDebounceSearch(handleChatSearch, 400);


    // Clear Search Input
    const hasClearedRef = useRef(false);
    useEffect(() => {
        if (!activeChatData) return;
        if (hasClearedRef.current) return;
        hasClearedRef.current = true;
        reset();
    }, [activeChatData, reset, updateChatSearchResults]);

    // reset guard when chat changes again
    useEffect(() => {
        hasClearedRef.current = false;
    }, [activeChatData?._id]);

    if (!isAppReady || isLoading) return <SidebarSearchSkeleton />;

    return (
        <div className="flex flex-row px-4 justify-center items-center">
            <div className="relative w-full h-full rounded-full">
                {/* Search Icon */}
                <div className="absolute text-xl inset-y-0 flex items-center pl-3 text-gray-500">
                    <TbSearch />
                </div>

                {/* Search Bar */}
                <input
                    type="text"
                    placeholder="Search Messenger"
                    value={query}
                    onChange={handleChange}
                    className="w-full text-sm bg-gray-100 py-2 pl-10 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
            </div>
        </div>
    );
}

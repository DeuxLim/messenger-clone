import { useEffect, useMemo, useState } from "react";
import { isEmpty } from "../../../utilities/utils";
import useAuth from "../../auth/useAuth";
import useSocket from "../../socket/useSocket";
import useChatSearch from "../ChatSearch/useChatSearch";
import { loadChatOverview } from "../../../services/chats.service";
import ChatDataContext from "./ChatDataContext";
import useToast from "../../ui/useToast";
import { getErrorMessage } from "../../../utilities/errors";

export default function ChatDataProvider({ children }) {
    const { token } = useAuth();
    const { socket } = useSocket();
    const chatSearch = useChatSearch();
    const toast = useToast();
    const isSearch = chatSearch?.isSearch ?? false;
    const isReady = Boolean(token && socket);

    const [chatItems, setChatItems] = useState([]);
    const [userItems, setUserItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const usersAndChatsList = useMemo(() => {
        const chats = (chatItems || []).map((c) => ({ ...c, type: "chat" }));
        const users = (userItems || []).map((u) => ({ ...u, type: "user" }));
        return [...chats, ...users];
    }, [chatItems, userItems]);

    useEffect(() => {
        if (!isReady || isSearch) return;

        const fetchChatData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const { chats, users } = await loadChatOverview();
                setChatItems(chats);
                setUserItems(users);
            } catch (err) {
                const message = getErrorMessage(err, "Failed to load chats. Please try again.");
                setError(message);
                toast.error(message);
            } finally {
                setIsLoading(false);
            }
        };

        if (isEmpty(usersAndChatsList)) {
            fetchChatData();
        }
    }, [isReady, isSearch, usersAndChatsList, toast]);

    const data = {
        chatItems,
        setChatItems,
        userItems,
        setUserItems,
        usersAndChatsList,
        isLoading,
        error,
    };

    return (
        <ChatDataContext.Provider value={data}>
            {children}
        </ChatDataContext.Provider>
    );
}

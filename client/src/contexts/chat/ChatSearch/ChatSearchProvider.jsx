import { useCallback, useState } from "react";
import ChatSearchContext from "./ChatSearchContext";

export default function ChatSearchProvider({ children }) {
    const [isSearch, setIsSearch] = useState(false);
    const [searchResults, setSearchResults] = useState([]);

    const updateChatSearchResults = useCallback(
        ({ chats = [], users = [], isSearch = false }) => {
            const searchChatsList = (chats || []).map((c) => ({ ...c, type: "chat" }));
            const searchUsersList = (users || []).map((u) => ({ ...u, type: "user" }));
            setSearchResults([...searchChatsList, ...searchUsersList]);
            setIsSearch(isSearch);
        },
        [],
    );

    const data = {
        isSearch,
        setIsSearch,
        searchResults,
        updateChatSearchResults,
    };

    return (
        <ChatSearchContext.Provider value={data}>
            {children}
        </ChatSearchContext.Provider>
    );
}

import { useContext } from "react";
import ChatDataContext from "./ChatData/ChatDataContext";
import ChatPresenceContext from "./ChatPresence/ChatPresenceContext";
import ChatRealtimeContext from "./ChatRealtime/ChatRealtimeContext";
import ChatSearchContext from "./ChatSearch/ChatSearchContext";
import ChatSessionContext from "./ChatSession/ChatSessionContext";

export default function useChat(){
    const chatSessionContext = useContext(ChatSessionContext);
    const chatDataContext = useContext(ChatDataContext);
    const presenceContext = useContext(ChatPresenceContext);
    const realtimeContext = useContext(ChatRealtimeContext);
    const searchContext = useContext(ChatSearchContext);

    return {
        ...(chatDataContext || {}),
        ...(chatSessionContext || {}),
        ...(presenceContext || {}),
        ...(realtimeContext || {}),
        ...(searchContext || {}),
    };
}

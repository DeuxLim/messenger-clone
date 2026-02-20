import { useContext } from "react";
import ChatContext from "./ChatContext";
import ChatDataContext from "./ChatData/ChatDataContext";
import ChatPresenceContext from "./ChatPresence/ChatPresenceContext";
import ChatRealtimeContext from "./ChatRealtime/ChatRealtimeContext";
import ChatSearchContext from "./ChatSearch/ChatSearchContext";

export default function useChat(){
    const chatContext = useContext(ChatContext);
    const chatDataContext = useContext(ChatDataContext);
    const presenceContext = useContext(ChatPresenceContext);
    const realtimeContext = useContext(ChatRealtimeContext);
    const searchContext = useContext(ChatSearchContext);

    return {
        ...(chatDataContext || {}),
        ...(chatContext || {}),
        ...(presenceContext || {}),
        ...(realtimeContext || {}),
        ...(searchContext || {}),
    };
}

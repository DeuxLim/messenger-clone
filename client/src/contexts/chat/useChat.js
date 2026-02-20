import { useContext } from "react";
import ChatContext from "./ChatContext";
import ChatPresenceContext from "./ChatPresence/ChatPresenceContext";
import ChatRealtimeContext from "./ChatRealtime/ChatRealtimeContext";

export default function useChat(){
    const chatContext = useContext(ChatContext);
    const presenceContext = useContext(ChatPresenceContext);
    const realtimeContext = useContext(ChatRealtimeContext);

    return {
        ...(chatContext || {}),
        ...(presenceContext || {}),
        ...(realtimeContext || {}),
    };
}

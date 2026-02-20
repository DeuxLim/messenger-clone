import { useContext } from "react";
import ChatContext from "./ChatContext";
import ChatPresenceContext from "./ChatPresence/ChatPresenceContext";

export default function useChat(){
    const chatContext = useContext(ChatContext);
    const presenceContext = useContext(ChatPresenceContext);

    return {
        ...(chatContext || {}),
        ...(presenceContext || {}),
    };
}

import { useContext } from "react";
import ChatPresenceContext from "./ChatPresenceContext";

export default function useChatPresence() {
    return useContext(ChatPresenceContext);
}

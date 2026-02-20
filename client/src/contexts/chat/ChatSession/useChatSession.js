import { useContext } from "react";
import ChatSessionContext from "./ChatSessionContext";

export default function useChatSession() {
    return useContext(ChatSessionContext);
}

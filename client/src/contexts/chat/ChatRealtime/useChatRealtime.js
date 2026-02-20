import { useContext } from "react";
import ChatRealtimeContext from "./ChatRealtimeContext";

export default function useChatRealtime() {
    return useContext(ChatRealtimeContext);
}

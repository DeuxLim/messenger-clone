import { useContext } from "react";
import ChatDataContext from "./ChatDataContext";

export default function useChatData() {
    return useContext(ChatDataContext);
}

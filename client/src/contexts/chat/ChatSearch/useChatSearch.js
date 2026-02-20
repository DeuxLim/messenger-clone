import { useContext } from "react";
import ChatSearchContext from "./ChatSearchContext";

export default function useChatSearch() {
    return useContext(ChatSearchContext);
}

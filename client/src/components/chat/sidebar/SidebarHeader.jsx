import { Link } from "react-router"
import { RiEditBoxLine } from "react-icons/ri";

import SidebarHeaderSkeleton from "./SidebarHeaderSkeleton";
import useAuth from "../../../contexts/auth/useAuth";
import useSocket from "../../../contexts/socket/useSocket";
import useChatData from "../../../contexts/chat/ChatData/useChatData";

export default function SidebarHeader() {
	const { isLoading } = useChatData();
	const { authStatus } = useAuth();
	const { socketStatus } = useSocket();

	const isAppReady =
		authStatus === "authenticated" &&
		socketStatus === "connected";

	if (!isAppReady || isLoading) return <SidebarHeaderSkeleton />;

	return (
		<>
			<header className="flex">
				<div className="flex justify-between w-full items-center px-5 py-2">
					<h1 className='text-2xl font-semibold'>Chats</h1>
					<Link to="/chats/new" className="hidden md:flex justify-center items-center p-2 rounded-full bg-gray-100 dark:bg-gray-700">
						<div className="text-xl flex justify-center items-center">
							<RiEditBoxLine />
						</div>
					</Link>
				</div>
			</header>
		</>
	);
}

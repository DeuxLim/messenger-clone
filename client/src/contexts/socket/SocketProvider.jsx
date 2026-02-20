import { useEffect, useState } from "react";
import useAuth from "../auth/useAuth";
import { connectSocket, disconnectSocket, getSocket } from "../../services/socket.service";
import SocketContext from "./SocketContext";
import { announceOnline } from "../../realtime/presenceSocket";

export default function SocketProvider({ children }) {
	const { authStatus, token, currentUser } = useAuth();
	const [socketStatus, setSocketStatus] = useState("idle");

	useEffect(() => {
		if (authStatus !== "authenticated") {
			disconnectSocket();
			setSocketStatus("idle");
			return;
		}

		setSocketStatus("connecting");

		try {
			const socket = connectSocket(token);

			socket.on("connect", () => {
				setSocketStatus("connected");
				announceOnline(currentUser._id);
			});

			socket.on("connect_error", () => {
				setSocketStatus("error");
			});

		} catch {
			setSocketStatus("error");
		}

		return () => {
			disconnectSocket();
			setSocketStatus("idle");
		};
	}, [authStatus, token, currentUser?._id]);

	return (
		<SocketContext.Provider value={{ socket: getSocket(), socketStatus }}>
			{children}
		</SocketContext.Provider>
	);
}

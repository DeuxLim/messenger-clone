// App.jsx
import { RouterProvider } from "react-router";
import { routes } from "./routes/router";
import AuthProvider from "./contexts/auth/AuthProvider";
import SocketProvider from "./contexts/socket/SocketProvider";
import ToastProvider from "./contexts/ui/ToastProvider";

export default function App() {
    return (
        <ToastProvider>
            <AuthProvider>
                <SocketProvider>
                    <RouterProvider router={routes} />
                </SocketProvider>
            </AuthProvider>
        </ToastProvider>
    );
}

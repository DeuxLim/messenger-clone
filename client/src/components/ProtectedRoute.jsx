import { Navigate, Outlet } from "react-router";
import useAuth from "../contexts/auth/useAuth";
import MobileBottomNav from "./chat/mobile/MobileBottomNav";

export default function ProtectedRoute() {
    const { authStatus } = useAuth();

    // Once ready, decide route
    return authStatus === "authenticated" || authStatus === "checking"
        ? (
            <>
                <Outlet />
                <MobileBottomNav />
            </>
        )
        : <Navigate to="/auth/login" replace />;
}

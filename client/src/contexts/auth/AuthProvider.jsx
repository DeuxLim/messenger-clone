import { useCallback, useEffect, useRef, useState } from "react";
import AuthContext from "./AuthContext";
import { fetchAPI } from "../../api/fetchAPI";
import { logoutService, refreshSessionService } from "../../services/auth.service";
import { updatePassword, updateProfile } from "../../services/user.service";
import useToast from "../ui/useToast";
import { getErrorMessage } from "../../utilities/errors";

export default function AuthProvider({ children }) {
    const [authStatus, setAuthStatus] = useState("checking"); // "checking" | "authenticated" | "unauthenticated"
    const [currentUser, setCurrentUser] = useState(null);
    const [token, setToken] = useState(null);
    const hasBootstrapped = useRef(false);
    const toast = useToast();

    const setAuthenticated = (user, accessToken) => {
        setCurrentUser(user);
        setToken(accessToken);
        setAuthStatus("authenticated");
    };

    const setUnauthenticated = () => {
        setCurrentUser(null);
        setToken(null);
        setAuthStatus("unauthenticated");
    };

    const login = (user, accessToken) => {
        if (!user || !accessToken) {
            console.error("invalid login payload");
            return;
        }
        setAuthenticated(user, accessToken);
    };

    const logout = async () => {
        try {
            await logoutService();
        } finally {
            setUnauthenticated();
        }
    };

    const refreshToken = useCallback(async () => {
        try {
            const { user, accessToken } = await refreshSessionService();
            setAuthenticated(user, accessToken);
        } catch (err) {
            console.error("Refresh failed:", err);
            setUnauthenticated();
        }
    }, []);

    useEffect(() => {
        fetchAPI.setAuth(token);
    }, [token]);

    useEffect(() => {
        // 🔑 run refresh ONLY once on app boot
        if (hasBootstrapped.current) return;
        hasBootstrapped.current = true;

        refreshToken();
    }, [refreshToken]);

    const value = {
        currentUser,
        token,
        authStatus,
        login,
        logout,
        refreshToken,
        updateUserProfile: async (data) => {
            try {
                const response = await updateProfile(data);
                setCurrentUser(response.user);
                toast.success("Profile updated.");
            } catch (error) {
                toast.error(getErrorMessage(error, "Failed to update profile."));
            }
        },
        updatePassword: async (data) => {
            try {
                const response = await updatePassword(data);
                toast.success("Password updated.");

                return response;
            } catch (error) {
                toast.error(getErrorMessage(error, "Failed to update password."));
            }
        },
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

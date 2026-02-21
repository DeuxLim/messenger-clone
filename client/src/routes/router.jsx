import { createBrowserRouter, Navigate } from "react-router";
import RouteErrorBoundary from "./RouteErrorBoundary";

const lazyComponent = (importer) =>
    async () => {
        const module = await importer();
        return { Component: module.default };
    };

const routeHydrateFallback = <></>;

export const routes = createBrowserRouter([
    {
        path: "/auth",
        hydrateFallbackElement: routeHydrateFallback,
        errorElement: <RouteErrorBoundary />,
        lazy: lazyComponent(() => import("../pages/Auth/StartAuth")),
        children: [
            { index: true, lazy: lazyComponent(() => import("../pages/Auth/Login")) },
            { path: "login", lazy: lazyComponent(() => import("../pages/Auth/Login")) },
            { path: "register", lazy: lazyComponent(() => import("../pages/Auth/Register")) },
            { path: "verify-email", lazy: lazyComponent(() => import("../pages/Auth/VerifyEmail")) },
            { path: "forgot-password", lazy: lazyComponent(() => import("../pages/Auth/ForgotPassword")) },
            { path: "reset-password", lazy: lazyComponent(() => import("../pages/Auth/ResetPassword")) },
        ],
    },
    {
        hydrateFallbackElement: routeHydrateFallback,
        errorElement: <RouteErrorBoundary />,
        lazy: lazyComponent(() => import("../components/ProtectedRoute")),
        children: [
            {
                hydrateFallbackElement: routeHydrateFallback,
                errorElement: <RouteErrorBoundary />,
                lazy: lazyComponent(() => import("./ChatProvidersShell")),
                children: [
                    {
                        path: "/chats",
                        hydrateFallbackElement: routeHydrateFallback,
                        errorElement: <RouteErrorBoundary />,
                        lazy: lazyComponent(() => import("../pages/ChatApp")),
                        children: [
                            {
                                path: "",
                                lazy: lazyComponent(() => import("../components/chat/MainWindow")),
                                children: [
                                    { index: true, lazy: lazyComponent(() => import("../components/chat/start/Start")) },
                                    {
                                        path: ":chatId",
                                        lazy: lazyComponent(() => import("../components/chat/conversation/ChatLayout")),
                                        children: [
                                            { index: true, lazy: lazyComponent(() => import("../components/chat/conversation/ChatWindow")) },
                                        ],
                                    },
                                    {
                                        path: "new",
                                        lazy: lazyComponent(() => import("../components/chat/conversation/ChatLayout")),
                                        children: [
                                            { index: true, lazy: lazyComponent(() => import("../components/chat/conversation/ChatWindow")) },
                                        ],
                                    },
                                    {
                                        path: "*",
                                        element: <Navigate to="." replace />,
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        path: "/profile",
                        lazy: lazyComponent(() => import("../pages/Profile")),
                    },
                ],
            },
        ],
    },
    {
        path: "/",
        element: <Navigate to="/auth/login" replace />,
    },
]);

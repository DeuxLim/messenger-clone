import { useCallback, useMemo, useState } from "react";
import ToastContext from "./ToastContext";

const DEFAULT_DURATION = 3500;

export default function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback((message, options = {}) => {
        if (!message) return;

        const id = crypto.randomUUID();
        const type = options.type || "info";
        const duration = options.duration ?? DEFAULT_DURATION;

        setToasts((prev) => [...prev, { id, message, type }]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, [removeToast]);

    const api = useMemo(
        () => ({
            showToast,
            success: (message, options = {}) =>
                showToast(message, { ...options, type: "success" }),
            error: (message, options = {}) =>
                showToast(message, { ...options, type: "error" }),
            info: (message, options = {}) =>
                showToast(message, { ...options, type: "info" }),
        }),
        [showToast],
    );

    return (
        <ToastContext.Provider value={api}>
            {children}

            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
                {toasts.map((toast) => {
                    const palette =
                        toast.type === "error"
                            ? "bg-red-600 text-white"
                            : toast.type === "success"
                                ? "bg-green-600 text-white"
                                : "bg-gray-900 text-white";

                    return (
                        <div
                            key={toast.id}
                            className={`rounded-lg px-4 py-3 shadow-lg flex items-start gap-3 ${palette}`}
                        >
                            <div className="text-sm leading-5 flex-1">{toast.message}</div>
                            <button
                                type="button"
                                className="text-xs opacity-80 hover:opacity-100"
                                onClick={() => removeToast(toast.id)}
                                aria-label="Close notification"
                            >
                                X
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

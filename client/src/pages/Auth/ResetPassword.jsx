import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { resetPasswordService } from "../../services/auth.service";
import useToast from "../../contexts/ui/useToast";
import { getErrorMessage } from "../../utilities/errors";

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [status, setStatus] = useState("idle"); // idle | loading | success | error
    const [message, setMessage] = useState("");
    const toast = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) {
            setStatus("error");
            setMessage("Invalid or missing reset token.");
            return;
        }

        if (password.length < 8) {
            setStatus("error");
            setMessage("Password must be at least 8 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setStatus("error");
            setMessage("Passwords do not match.");
            return;
        }

        try {
            setStatus("loading");

            await resetPasswordService({ token, password });

            setStatus("success");
            setMessage("Your password has been reset successfully.");
        } catch (err) {
            toast.error(getErrorMessage(err, "Reset failed."));
            setStatus("error");
            setMessage(err.message || "Reset failed.");
        }
    };

    return (
        <div className="flex items-center justify-center w-full px-4 min-h-80">
            <div className="w-full max-w-md rounded-lg bg-white p-6 text-center">

                {/* Title */}
                <h1 className="text-xl font-semibold text-gray-800">
                    Reset password
                </h1>

                {/* Subtitle */}
                <p className="mt-2 text-sm text-gray-600">
                    Enter your new password below.
                </p>

                {/* Form */}
                {status !== "success" && (
                    <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                New password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 w-full rounded border border-gray-400 px-3 py-2 focus:border-blue-500 focus:outline-none"
                                placeholder="New password"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Confirm password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="mt-1 w-full rounded border border-gray-400 px-3 py-2 focus:border-blue-500 focus:outline-none"
                                placeholder="Confirm password"
                                required
                            />
                        </div>

                        {status === "error" && (
                            <p className="text-sm text-red-600">{message}</p>
                        )}

                        <button
                            type="submit"
                            disabled={status === "loading"}
                            className="mt-2 w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-400 disabled:opacity-50"
                        >
                            {status === "loading" ? "Resetting..." : "Reset password"}
                        </button>
                    </form>
                )}

                {/* Success state */}
                {status === "success" && (
                    <>
                        <p className="mt-4 text-sm text-green-600">{message}</p>

                        <Link
                            to="/auth/login"
                            className="mt-6 inline-block w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-400"
                        >
                            Go to login
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}

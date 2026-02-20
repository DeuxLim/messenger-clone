import { useId, useState } from "react";
import { Link, useNavigate } from "react-router";
import { isEmpty } from "../../utilities/utils";
import { forgotPasswordService } from "../../services/auth.service";
import useToast from "../../contexts/ui/useToast";
import { getErrorMessage } from "../../utilities/errors";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [errors, setErrors] = useState({});
    const [status, setStatus] = useState("idle"); // idle | loading | success | error
    const [message, setMessage] = useState("");

    const elementUserEmailId = useId();
    const navigate = useNavigate();
    const toast = useToast();

    function validateForm() {
        const newErrors = {};

        if (!email.trim()) {
            newErrors.email = "Email cannot be empty";
        }

        return newErrors;
    }

    async function handleSubmit(e) {
        e.preventDefault();

        const validationErrors = validateForm();
        setErrors(validationErrors);
        if (!isEmpty(validationErrors)) return;

        setStatus("loading");
        setErrors({});
        setMessage("");

        try {
            await forgotPasswordService(email);

            setStatus("success");
            setMessage(
                "If that email exists, a password reset link has been sent."
            );
        } catch (err) {
            toast.error(getErrorMessage(err, "Something went wrong. Please try again."));
            setStatus("error");
            setMessage("Something went wrong. Please try again.");
        }
    }

    return (
        <div className="flex items-center justify-center w-full px-4 min-h-80">
            <div className="w-full max-w-md rounded-lg bg-white p-6 text-center">
                {status === "idle" && (
                    <>
                        <h1 className="text-xl font-semibold text-gray-800">
                            Forgot your password?
                        </h1>
                        <p className="mt-2 text-sm text-gray-600">
                            Enter your email and we’ll send you a reset link.
                        </p>

                        <form onSubmit={handleSubmit} className="mt-6 text-left">
                            {/* EMAIL */}
                            <div className="flex flex-col">
                                <label
                                    htmlFor={elementUserEmailId}
                                    className="mb-1 text-sm text-gray-700"
                                >
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id={elementUserEmailId}
                                    name="user-email"
                                    className="rounded border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                                    placeholder="Enter your email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* SUBMIT */}
                            <button
                                type="submit"
                                disabled={status === "loading"}
                                className={`mt-4 inline-block w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-400 ${status === "loading"
                                    ? "cursor-not-allowed opacity-50"
                                    : ""
                                    }`}
                            >
                                {status === "loading"
                                    ? "Sending request…"
                                    : "Send reset link"}
                            </button>
                        </form>

                        <button
                            onClick={() => navigate(-1)}
                            className="mt-4 text-sm text-blue-500 hover:underline"
                        >
                            Back to login
                        </button>
                    </>
                )}

                {(status === "success" || status === "error") && (
                    <>
                        <h1
                            className={`text-xl font-semibold ${status === "success"
                                ? "text-green-600"
                                : "text-red-600"
                                }`}
                        >
                            {status === "success"
                                ? "Check your email"
                                : "Request failed"}
                        </h1>

                        <p className="mt-2 text-sm text-gray-600">
                            {message}
                        </p>

                        <Link
                            to="/auth/login"
                            className="mt-4 inline-block w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-400"
                        >
                            Go to login
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}

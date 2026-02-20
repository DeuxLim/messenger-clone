import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { verifyEmailService } from "../../services/auth.service";
import useToast from "../../contexts/ui/useToast";
import { getErrorMessage } from "../../utilities/errors";

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const [status, setStatus] = useState("loading");
    const [message, setMessage] = useState("");
    const toast = useToast();

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Invalid or missing verification token.");
            return;
        }

        const verifyEmail = async () => {
            try {
                await verifyEmailService(token);

                setStatus("success");
                setMessage("Your email has been verified. Please log in again.");
            } catch (err) {
                toast.error(getErrorMessage(err, "Verification failed."));
                setStatus("error");
                setMessage(err.message || "Verification failed.");
            }
        };

        verifyEmail();
    }, [token, toast]);

    return (
        <div className="flex items-center justify-center w-full px-4 min-h-80">
            <div className="w-full max-w-md rounded-lg bg-white p-6 text-center">
                {status === "loading" && (
                    <>
                        <h1 className="text-xl font-semibold text-gray-800">
                            Verifying email
                        </h1>
                        <p className="mt-2 text-sm text-gray-600">
                            Please wait a moment…
                        </p>
                    </>
                )}

                {(status === "success" || status === "error") && (
                    <>
                        <h1
                            className={`text-xl font-semibold ${status === "success" ? "text-green-600" : "text-red-600"
                                }`}
                        >
                            {status === "success" ? "Email verified" : "Verification failed"}
                        </h1>

                        <p className="mt-2 text-sm text-gray-600">{message}</p>

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

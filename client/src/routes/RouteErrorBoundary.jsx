import { Link, isRouteErrorResponse, useRouteError } from "react-router";

export default function RouteErrorBoundary() {
    const error = useRouteError();

    let title = "Something went wrong";
    let message = "An unexpected routing error occurred.";

    if (isRouteErrorResponse(error)) {
        title = `Error ${error.status}`;
        message = error.statusText || message;
    } else if (error instanceof Error) {
        message = error.message;
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                <p className="mt-2 text-sm text-gray-600">{message}</p>
                <div className="mt-4">
                    <Link
                        to="/chats"
                        className="inline-flex items-center rounded-md bg-black px-4 py-2 text-sm text-white"
                    >
                        Go to Chats
                    </Link>
                </div>
            </div>
        </div>
    );
}

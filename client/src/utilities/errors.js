export const getErrorMessage = (
    error,
    fallback = "Something went wrong. Please try again.",
) => {
    if (!error) return fallback;
    if (typeof error === "string") return error;
    if (error?.message && typeof error.message === "string") return error.message;
    return fallback;
};

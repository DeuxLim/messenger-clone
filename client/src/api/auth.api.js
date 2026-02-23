import { fetchAPI } from "./fetchAPI";

const AUTH_COLD_START_OPTIONS = {
	timeout: 25000,
	maxRetries: 2,
	retryDelayMs: 1500,
	retryOnTimeout: true,
	retryOnNetworkError: true,
};

export const loginAPI = (payload) => {
	return fetchAPI.post("/auth/login", payload, AUTH_COLD_START_OPTIONS);
};

export const logoutAPI = () => {
	return fetchAPI.post("/auth/logout");
};

export const forgotPasswordAPI = (email) => {
	return fetchAPI.post(
		"/auth/forgot-password",
		{ email },
		AUTH_COLD_START_OPTIONS,
	);
};

export const refreshTokenAPI = () => {
	return fetchAPI.post("/auth/refresh", undefined, AUTH_COLD_START_OPTIONS);
};

export const getMeAPI = () => {
	return fetchAPI.get("/auth/me", AUTH_COLD_START_OPTIONS);
};

export const resendVerificationAPI = (email) => {
	return fetchAPI.post("/auth/resend-verification", { email });
};

export const registerAPI = (payload) => {
	return fetchAPI.post("/auth/register", payload, AUTH_COLD_START_OPTIONS);
};

export const resetPasswordAPI = ({ token, password }) => {
	return fetchAPI.post(
		"/auth/reset-password",
		{ token, password },
		AUTH_COLD_START_OPTIONS,
	);
};

export const verifyEmailAPI = (token) => {
	return fetchAPI.post(
		"/auth/verify-email",
		{ token },
		AUTH_COLD_START_OPTIONS,
	);
};

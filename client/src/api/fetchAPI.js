const BASE_URL = import.meta.env.VITE_API_URL;

// Global config for auth token
let authToken = null;
let refreshPromise = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function refreshAccessToken() {
	if (!refreshPromise) {
		refreshPromise = (async () => {
			const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
				method: "POST",
				credentials: "include",
			});

			if (!refreshRes.ok) throw new Error("Refresh failed");

			const data = await refreshRes.json();
			if (!data.accessToken) throw new Error("No access token");

			authToken = data.accessToken;
			return data.accessToken;
		})().finally(() => {
			refreshPromise = null;
		});
	}

	return refreshPromise;
}

async function fetchClient(
	endpoint,
	{
		method = "GET",
		body,
		headers = {},
		timeout = 10000,
		retry = true,
		maxRetries = 0,
		retryDelayMs = 1200,
		retryOnTimeout = false,
		retryOnNetworkError = false,
		retryAttempt = 0,
		...otherOptions
	} = {},
) {
	const config = {
		method,
		headers: {
			"Content-Type": "application/json",
			...headers,
		},
		credentials: "include",
		...otherOptions, // Include any other fetch options like credentials, mode, cache, etc.
	};

	// Add auth token if available
	if (authToken) {
		config.headers.Authorization = `Bearer ${authToken}`;
	}

	// Handle different body types
	if (body) {
		if (body instanceof FormData) {
			// Remove Content-Type for FormData (browser sets it)
			delete config.headers["Content-Type"];
			config.body = body;
		} else {
			config.body = JSON.stringify(body);
		}
	}

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeout);
	config.signal = controller.signal;

	try {
		const response = await fetch(`${BASE_URL}${endpoint}`, config);
		const isUnauthorized =
			response.status === 401 || response.status === 403;
		const canRetryWithRefresh =
			isUnauthorized && retry && !endpoint.startsWith("/auth/refresh");

		// 🔴 HERE: intercept expired access token
		if (canRetryWithRefresh) {
			try {
				await refreshAccessToken();

				// 🔁 Retry original request once
				return fetchClient(endpoint, {
					method,
					body,
					headers,
					timeout,
					retry: false, // prevent infinite loop
					maxRetries,
					retryDelayMs,
					retryOnTimeout,
					retryOnNetworkError,
					retryAttempt,
					...otherOptions,
				});
			} catch (err) {
				authToken = null;
				console.log(err);
				throw new Error("Session expired. Please log in again.");
			}
		}

		// Handle non-200 status
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			const error = new Error(
				errorData.message || `Error ${response.status}`,
			);
			error.status = response.status;
			throw error;
		}

		// Smart response parsing
		const contentType = response.headers.get("content-type");
		if (contentType?.includes("application/json")) {
			return await response.json();
		} else {
			return await response.text();
		}
	} catch (error) {
		if (error.name === "AbortError") {
			if (retryOnTimeout && retryAttempt < maxRetries) {
				const delay = retryDelayMs * (retryAttempt + 1);
				await sleep(delay);
				return fetchClient(endpoint, {
					method,
					body,
					headers,
					timeout,
					retry,
					maxRetries,
					retryDelayMs,
					retryOnTimeout,
					retryOnNetworkError,
					retryAttempt: retryAttempt + 1,
					...otherOptions,
				});
			}

			throw new Error("Request timeout");
		}

		const isNetworkError = error instanceof TypeError;
		if (isNetworkError && retryOnNetworkError && retryAttempt < maxRetries) {
			const delay = retryDelayMs * (retryAttempt + 1);
			await sleep(delay);
			return fetchClient(endpoint, {
				method,
				body,
				headers,
				timeout,
				retry,
				maxRetries,
				retryDelayMs,
				retryOnTimeout,
				retryOnNetworkError,
				retryAttempt: retryAttempt + 1,
				...otherOptions,
			});
		}
		console.error("Fetch error:", error.message);
		throw error;
	} finally {
		clearTimeout(timeoutId);
	}
}

// Helper to set auth token
function setAuthToken(token) {
	authToken = token;
}

// Helper to clear auth token
function clearAuthToken() {
	authToken = null;
}

// Helper for file uploads
function uploadFile(endpoint, file, additionalData = {}) {
	const formData = new FormData();
	formData.append("file", file);

	Object.entries(additionalData).forEach(([key, value]) => {
		formData.append(key, value);
	});

	return fetchAPI.post(endpoint, formData);
}

// Shortcut helpers
export const fetchAPI = {
	get: (endpoint, options = {}) =>
		fetchClient(endpoint, { ...options, method: "GET" }),
	post: (endpoint, body, options = {}) =>
		fetchClient(endpoint, { ...options, method: "POST", body }),
	put: (endpoint, body, options = {}) =>
		fetchClient(endpoint, { ...options, method: "PUT", body }),
	patch: (endpoint, body, options = {}) =>
		fetchClient(endpoint, { ...options, method: "PATCH", body }),
	delete: (endpoint, options = {}) =>
		fetchClient(endpoint, { ...options, method: "DELETE" }),
	warmup: (options = {}) =>
		fetchClient("/welcome", {
			...options,
			method: "GET",
			retry: false,
			retryOnTimeout: true,
			retryOnNetworkError: true,
		}),

	// Auth helpers
	setAuth: setAuthToken,
	clearAuth: clearAuthToken,

	// File upload helper
	upload: uploadFile,
};

// Usage examples:
// const users = await api.get('/users');
// const user = await api.post('/users', { name: 'John' });
// api.setAuth('your-jwt-token');
// await api.upload('/files', fileInput.files[0], { description: 'Avatar' });

// With options:
// await api.get('/users', { timeout: 5000, headers: { 'Custom': 'value' } });
// await api.post('/users', { name: 'John' }, { timeout: 15000 });
// await api.delete('/users/1', { headers: { 'X-Confirm': 'true' } });

// With fetch options:
// await api.get('/users', { credentials: 'include', mode: 'cors' });
// await api.post('/login', { email, password }, { credentials: 'include' });
// await api.get('/data', { cache: 'no-cache', credentials: 'same-origin' });

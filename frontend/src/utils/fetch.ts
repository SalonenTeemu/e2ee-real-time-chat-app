import { env } from './env';

/**
 * Helper function to fetch again in case of 401 or 403 errors and to handle rate limiting responses.
 *
 * @param {string} url The URL to fetch
 * @param {RequestInit} options The options for the fetch request
 * @param {function} addNotification The function to add a notification
 * @param {function} logout The function to log out the user
 * @returns {Response | null} The response from the fetch request or null if an error occurred
 */
export const fetchWithAuth = async (
	url: string,
	options: RequestInit = {},
	addNotification: (type: 'success' | 'error' | 'info', message: string, duration?: number) => void,
	logout: () => void
) => {
	try {
		options.credentials = 'include';
		// Fetch the URL with the provided options
		const res = await fetch(url, options);

		// Check for rate limiting related errors
		if (res.status === 429) {
			addNotification('error', 'Too many requests. Please try again later.');
			return null;
		}
		// If the response is 401 or 403, try to refresh the token and fetch again
		if (res.status === 401 || res.status === 403) {
			const refreshRes = await fetch(`http://localhost:${env.VITE_BACKEND_PORT}/api/auth/refresh`, {
				method: 'POST',
				credentials: 'include',
			});
			// If the refresh token request fails, log out the user and show a notification
			if (!refreshRes.ok) {
				logout();
				addNotification('info', 'Session expired. Please log in again.');
				return null;
			}
			// If the refresh token request is successful, try fetching the original URL again
			return await fetch(url, options);
		}
		return res;
	} catch {
		addNotification('error', 'Network error. Please try again later.');
		return null;
	}
};

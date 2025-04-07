/**
 * Helper function to fetch again in case of 401 or 403 errors and to ahndle rate limiting responses.
 *
 * @param url The URL to fetch
 * @param options The options to pass to the fetch function
 * @param addNotification The function to add a notification
 * @param logout The function to log out the user
 * @returns The response from the fetch function or null in case of an error
 */
export const fetchWithAuth = async (
	url: string,
	options: RequestInit = {},
	addNotification: (type: 'success' | 'error' | 'info', message: string, duration?: number) => void,
	logout: () => void
) => {
	try {
		options.credentials = 'include';
		const res = await fetch(url, options);
		if (res.status === 429) {
			addNotification('error', 'Too many requests. Please try again later.');
			return null;
		}
		if (res.status === 401 || res.status === 403) {
			const refreshRes = await fetch(`http://localhost:${import.meta.env.VITE_BACKEND_PORT || 5000}/api/auth/refresh`, {
				method: 'POST',
				credentials: 'include',
			});
			if (!refreshRes.ok) {
				logout();
				addNotification('info', 'Session expired. Please log in again.');
				return null;
			}
			return await fetch(url, options);
		}
		return res;
	} catch {
		addNotification('error', 'Network error. Please try again later.');
		return null;
	}
};

const env = import.meta.env.VITE_ENV || 'development';
const isDevelopment = env === 'development';

/**
 * Logs a message to the console if the environment is development.
 *
 * @param {string} message The message to log
 */
export const log = (message: string) => {
	if (isDevelopment) {
		console.log(message);
	}
};

/**
 * Logs an error message to the console if the environment is development.
 *
 * @param {string} message The message to log
 * @param {any} error The error object to log (optional)
 */
export const logError = (message: string, error?: any) => {
	if (isDevelopment) {
		console.error(message, error);
	}
};

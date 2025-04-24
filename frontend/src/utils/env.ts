/**
 * Environment variables for the application.
 * Required due to Jest tests as it can't load them through Vite.
 */
export const env = {
	VITE_ENV: import.meta.env.VITE_ENV || 'development',
	VITE_BACKEND_PORT: import.meta.env.VITE_BACKEND_PORT || 5000,
	VITE_FRONTEND_PORT: import.meta.env.VITE_FRONTEND_PORT || 5173,
	INDEXED_DB_NAME: import.meta.env.INDEXED_DB_NAME || 'chat',
	STORE_NAME: import.meta.env.STORE_NAME || 'keys',
};

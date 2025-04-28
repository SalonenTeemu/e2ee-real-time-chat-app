import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { env } from '../utils/env';
import { useNotification } from '../context/NotificationContext';
import { fetchWithAuth } from '../utils/fetch';
import { User } from '../utils/types';
import { clearKeys } from '../services/key/keys';
import { disconnectSocket } from '../services/socket';
import { logError } from '../utils/logger';

// Define the auth context type
interface AuthContextType {
	user: User | null;
	logout: () => void;
	fetchUser: () => void;
	setUser: (user: User | null) => void;
}

// Create the auth context with an initial value of undefined
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * The AuthProvider component provides the auth context to its children.
 *
 * @returns {JSX.Element} The AuthProvider component
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const notificationContext = useNotification();
	const [user, setUser] = useState<User | null>(null);
	const navigate = useNavigate();

	/**
	 * Fetches the currently authenticated user.
	 */
	const fetchUser = async () => {
		try {
			const res = await fetchWithAuth(`http://localhost:${env.VITE_BACKEND_PORT}/api/auth/me`, {}, notificationContext.addNotification, logout);
			if (!res) {
				return;
			}
			const data = await res.json();
			if (res.ok && data.message) {
				setUser(data.message);
			} else {
				setUser(null);
			}
		} catch (error: any) {
			logError('Error fetching user:', error);
			setUser(null);
		}
	};

	// Fetch the user on mount
	useEffect(() => {
		fetchUser();
	}, []);

	/**
	 * Logs out the user.
	 */
	const logout = useCallback(async () => {
		try {
			await fetch(`http://localhost:${env.VITE_BACKEND_PORT}/api/auth/logout`, {
				method: 'POST',
				credentials: 'include',
			});
			// Disconnect the socket if it exists
			disconnectSocket();

			// Set the user to null and clear keys
			setUser(null);
			clearKeys();
			navigate('/');
		} catch (error: any) {
			logError('Error logging out:', error);
		}
	}, []);

	// Refresh the token every 14 minutes
	useEffect(() => {
		/**
		 * Refreshes the access token by sending a POST request to the server.
		 */
		const refreshToken = async () => {
			if (!user) return;

			try {
				const res = await fetch(`http://localhost:${env.VITE_BACKEND_PORT}/api/auth/refresh`, {
					method: 'POST',
					credentials: 'include',
				});

				if (!res.ok) {
					logout();
				}
			} catch {
				logout();
			}
		};
		const interval = setInterval(refreshToken, 14 * 60 * 1000); // 14 minutes
		return () => clearInterval(interval);
	}, [user, logout]);

	return <AuthContext.Provider value={{ user, logout, setUser, fetchUser }}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use the auth context.
 *
 * @returns {AuthContextType} The auth context
 */
export const useAuth = (): AuthContextType => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};

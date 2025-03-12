import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../utils/types';

// Define the auth context type
interface AuthContextType {
	user: User | null;
	logout: () => void;
	fetchUser: () => void;
	setUser: (user: User | null) => void;
}

// Create the auth context with an initial value of undefined
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * The AuthProvider component provides the auth context to its children.
 *
 * @returns The AuthProvider component.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [user, setUser] = useState<User | null>(null);
	const navigate = useNavigate();

	/**
	 * Fetches the currently authenticated user.
	 */
	const fetchUser = async () => {
		try {
			const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/me`, {
				method: 'GET',
				credentials: 'include',
			});
			const data = await res.json();
			if (res.ok && data.message) {
				setUser(data.message);
			} else {
				setUser(null);
			}
		} catch (error) {
			console.error('User not authenticated', error);
			setUser(null);
		}
	};

	// Fetch the user on initial render
	useEffect(() => {
		fetchUser();
	}, []);

	/**
	 * Logs out the user.
	 */
	const logout = useCallback(async () => {
		try {
			await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/logout`, {
				method: 'POST',
				credentials: 'include',
			});
			setUser(null);
			navigate('/');
		} catch (error) {
			console.error('Error logging out:', error);
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
				const res = await fetch('/api/auth/refresh', {
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
 * The useAuth hook returns the auth context.
 *
 * @returns The auth context.
 */
export const useAuth = (): AuthContextType => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};

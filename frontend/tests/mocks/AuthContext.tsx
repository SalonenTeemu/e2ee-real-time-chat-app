import { AuthContext } from '../../src/context/AuthContext';

// Props for the MockAuthProvider component
interface MockAuthProviderProps {
	user: any;
	children: React.ReactNode;
}

/**
 * Provides a mock implementation of the AuthContext for testing purposes.
 *
 * @param {any} user The user object to be passed to the provider
 * @param {React.ReactNode} children The children to be rendered inside the provider
 * @returns {JSX.Element} The AuthContext provider with mocked functions
 */
export const MockAuthProvider: React.FC<MockAuthProviderProps> = ({ user, children }) => {
	const logout = jest.fn();
	const fetchUser = jest.fn();
	const setUser = jest.fn();

	return <AuthContext.Provider value={{ user, logout, setUser, fetchUser }}>{children}</AuthContext.Provider>;
};

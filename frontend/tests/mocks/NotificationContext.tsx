import { NotificationContext } from '../../src/context/NotificationContext';

// Props for the MockNotificationProvider component
interface MockNotificationProviderProps {
	children: React.ReactNode;
}

/**
 * Provides a mock implementation of the NotificationContext for testing purposes.
 *
 * @param {React.ReactNode} children The children to be rendered inside the provider
 * @returns {JSX.Element} The NotificationContext provider with mocked functions
 */
export const MockNotificationProvider: React.FC<MockNotificationProviderProps> = ({ children }) => {
	const mockNotificationContext = {
		addNotification: jest.fn(),
		removeNotification: jest.fn(),
	};

	return <NotificationContext.Provider value={mockNotificationContext}>{children}</NotificationContext.Provider>;
};

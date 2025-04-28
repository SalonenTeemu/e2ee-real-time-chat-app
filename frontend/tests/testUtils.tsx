import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MockNotificationProvider } from './mocks/NotificationContext';
import { MockAuthProvider } from './mocks/AuthContext';

/**
 * Helper function to render components with necessary providers for testing.
 *
 * @param {React.ReactElement} ui The component to be rendered
 * @param {any | null} user The user object to be passed to the MockAuthProvider or null if not needed
 * @returns {RenderResult} The result of the render function from @testing-library/react
 */
const renderWithMockProviders = (ui: React.ReactElement, user: any = null) => {
	return render(
		<MemoryRouter>
			<MockNotificationProvider>
				<MockAuthProvider user={user}>{ui}</MockAuthProvider>
			</MockNotificationProvider>
		</MemoryRouter>
	);
};

export * from '@testing-library/react';
export { renderWithMockProviders as render };

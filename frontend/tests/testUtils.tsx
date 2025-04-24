import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../src/context/AuthContext';
import { NotificationProvider } from '../src/context/NotificationContext';

/**
 * Helper function to render components with necessary providers for testing.
 *
 * @param ui The component to be rendered
 * @returns The rendered component wrapped in the necessary providers
 */
const renderWithProviders = (ui: React.ReactElement) =>
	render(
		<MemoryRouter>
			<NotificationProvider>
				<AuthProvider>{ui}</AuthProvider>
			</NotificationProvider>
		</MemoryRouter>
	);

export * from '@testing-library/react';
export { renderWithProviders as render };

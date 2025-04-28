import { render, screen, fireEvent } from '../../testUtils';
import RestoreWithSeedPhrase from '../../../src/components/auth-recovery/RestoreWithSeedPhrase';

/**
 * Test suite for the RestoreWithSeedPhrase component including rendering, validation errors, and button functionality.
 */
describe('RestoreWithSeedPhrase.tsx tests', () => {
	// Logged-in user mock
	const loggedInUser = {
		id: '12345',
		username: 'testuser',
	};

	it('should render the error message when user is not logged in', () => {
		render(<RestoreWithSeedPhrase />);

		expect(screen.getByText(/You need to be logged in to view this page./i)).toBeInTheDocument();
	});

	it('should render the restore with seed phrase component', () => {
		render(<RestoreWithSeedPhrase />, loggedInUser);

		expect(screen.getByText(/Restore Private Key With Seed Phrase/i)).toBeInTheDocument();
		expect(screen.getByPlaceholderText(/Enter your account password/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Restore/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Clear Fields/i })).toBeInTheDocument();
	});

	it('should clear the fields when Clear Fields button is clicked', () => {
		render(<RestoreWithSeedPhrase />, loggedInUser);

		const passwordInput = screen.getByPlaceholderText(/Enter your account password/i) as HTMLInputElement;

		fireEvent.change(passwordInput, { target: { value: 'testpassword' } });
		fireEvent.click(screen.getByText(/Clear Fields/i));

		expect(passwordInput.value).toBe('');
	});
});

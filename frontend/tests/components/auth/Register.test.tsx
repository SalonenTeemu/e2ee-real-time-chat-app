import { useNavigate } from 'react-router-dom';
import { render, screen, fireEvent, waitFor } from '../../testUtils';
import Register from '../../../src/components/auth/Register';
import { mockFetchSuccess, mockFetchFailure } from '../../mocks/fetchMock';

/**
 * Test suite for the Register component including rendering, validation errors, and successful registration.
 */
describe('Register.tsx tests', () => {
	const mockNavigate = jest.fn();

	beforeEach(() => {
		(global.fetch as jest.Mock) = jest.fn(); // Mock the global fetch function to avoid actual network requests
		(useNavigate as jest.Mock).mockReturnValue(mockNavigate); // Mock the useNavigate hook to avoid actual navigation
	});

	it('should render the form fields', () => {
		render(<Register />);

		expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Register/i })).toBeInTheDocument();
	});

	it('should show error when passwords do not match', async () => {
		render(<Register />);

		fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'testuser' } });
		fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'Password123-' } });
		fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'DifferentPassword' } });
		fireEvent.click(screen.getByRole('button', { name: /Register/i }));

		expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
	});

	it('should show error when password is too weak', async () => {
		render(<Register />);

		fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'testuser' } });
		fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'weak' } });
		fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'weak' } });
		fireEvent.click(screen.getByRole('button', { name: /Register/i }));

		expect(
			await screen.findByText(
				/Password must be between 12 and 100 characters and have lower case, upper case, number, and a special character./i
			)
		).toBeInTheDocument();
	});

	it('should show error when username is invalid', async () => {
		render(<Register />);

		fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'ab' } });
		fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'Password123-' } });
		fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'Password123-' } });
		fireEvent.click(screen.getByRole('button', { name: /Register/i }));

		expect(await screen.findByText(/Username must be between 4 and 50 characters./i)).toBeInTheDocument();
	});

	it('should register successfully and navigate to login', async () => {
		mockFetchSuccess({});

		render(<Register />);

		fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'newuser' } });
		fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'Password123-' } });
		fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'Password123-' } });
		fireEvent.click(screen.getByRole('button', { name: /Register/i }));

		await waitFor(() => {
			expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/auth/register'), expect.any(Object));
		});

		expect(mockNavigate).toHaveBeenCalledWith('/login');
	});

	it('should show error message when registration fails', async () => {
		mockFetchFailure('User already exists', 400);

		render(<Register />);

		fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'existinguser' } });
		fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'Password123-' } });
		fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'Password123-' } });
		fireEvent.click(screen.getByRole('button', { name: /Register/i }));

		await waitFor(() => {
			expect(screen.getByText(/User already exists./i)).toBeInTheDocument();
		});
	});
});

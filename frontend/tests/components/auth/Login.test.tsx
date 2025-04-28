import { useNavigate } from 'react-router-dom';
import { render, screen, fireEvent, waitFor } from '../../testUtils';
import Login from '../../../src/components/auth/Login';
import { mockFetchSuccess, mockFetchFailure } from '../../mocks/fetchMock';

/**
 * Test suite for the Login component including rendering, validation errors, and successful login.
 */
describe('Login.tsx tests', () => {
	const mockNavigate = jest.fn();

	beforeEach(() => {
		(global.fetch as jest.Mock) = jest.fn(); // Mock the global fetch function to avoid actual network requests
		(useNavigate as jest.Mock).mockReturnValue(mockNavigate); // Mock the useNavigate hook to avoid actual navigation
	});

	it('should render the form fields', () => {
		render(<Login />);

		expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
	});

	it('should show error when password is too weak', async () => {
		render(<Login />);

		fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'testuser' } });
		fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'weak' } });
		fireEvent.click(screen.getByRole('button', { name: /Login/i }));

		expect(
			await screen.findByText(
				/Password must be between 12 and 100 characters and have lower case, upper case, number, and a special character./i
			)
		).toBeInTheDocument();
	});

	it('should login successfully', async () => {
		mockFetchSuccess({ userId: '123', requiresPublicKey: false });

		render(<Login />);

		fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'testuser' } });
		fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'Password123-' } });
		fireEvent.click(screen.getByRole('button', { name: /Login/i }));

		await waitFor(() => {
			expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/auth/login'), expect.any(Object));
		});
	});

	it('should show error when login fails', async () => {
		mockFetchFailure('Login failed. Please try again.', 401);

		render(<Login />);

		fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'testuser' } });
		fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'Password123-' } });
		fireEvent.click(screen.getByRole('button', { name: /Login/i }));

		await waitFor(() => {
			expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/auth/login'), expect.any(Object));
		});

		expect(await screen.findByText(/Login failed. Please try again./i)).toBeInTheDocument();
	});

	it('should show error when server is unreachable', async () => {
		(global.fetch as jest.Mock).mockRejectedValue(new Error('Network Error'));

		render(<Login />);

		fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'testuser' } });
		fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'Password123-' } });
		fireEvent.click(screen.getByRole('button', { name: /Login/i }));

		expect(await screen.findByText(/Login failed. Please try again./i)).toBeInTheDocument();
	});

	it('should display modal when seed phrase is required', async () => {
		mockFetchSuccess({ userId: '123', requiresPublicKey: true });

		render(<Login />);

		fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'testuser' } });
		fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'Password123-' } });
		fireEvent.click(screen.getByRole('button', { name: /Login/i }));

		await waitFor(() => {
			expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/auth/login'), expect.any(Object));
		});

		expect(await screen.findByText(/I have saved my seed phrase/i)).toBeInTheDocument();
	});
});

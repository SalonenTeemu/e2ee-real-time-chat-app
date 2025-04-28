import { render, screen, fireEvent } from '../../testUtils';
import PasswordModal from '../../../src/components/auth-recovery/PasswordModal';

/**
 * Test suite for the PasswordModal component including rendering, validation, and button functionality.
 */
describe('PasswordModal.tsx tests', () => {
	it('should render the password modal', () => {
		render(<PasswordModal onSubmit={jest.fn()} onClose={jest.fn()} />);

		expect(screen.getByText(/Enter Your Password To Proceed/i)).toBeInTheDocument();
		expect(screen.getByPlaceholderText(/Enter your password/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
	});

	it('should show an error message for invalid password', () => {
		render(<PasswordModal onSubmit={jest.fn()} onClose={jest.fn()} />);

		fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), { target: { value: 'short' } });
		fireEvent.click(screen.getByRole('button', { name: /Submit/i }));

		expect(
			screen.getByText(
				/Invalid password. Password must be between 12 and 100 characters and have lower case, upper case, number, and a special character./i
			)
		).toBeInTheDocument();
	});

	it('should call onClose and onSubmit with null when Cancel is clicked', () => {
		const mockOnSubmit = jest.fn();
		const mockOnClose = jest.fn();

		render(<PasswordModal onSubmit={mockOnSubmit} onClose={mockOnClose} />);

		fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

		expect(mockOnSubmit).toHaveBeenCalledWith(null);
		expect(mockOnClose).toHaveBeenCalledTimes(1);
	});

	it('should call onSubmit with the password when Submit is clicked', () => {
		const mockOnSubmit = jest.fn();
		const mockOnClose = jest.fn();

		render(<PasswordModal onSubmit={mockOnSubmit} onClose={mockOnClose} />);

		fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), { target: { value: 'ValidPassword123!' } });
		fireEvent.click(screen.getByRole('button', { name: /Submit/i }));

		expect(mockOnSubmit).toHaveBeenCalledWith('ValidPassword123!');
		expect(mockOnClose).toHaveBeenCalledTimes(1);
	});

	it('should call onSubmit with the password when Enter is pressed', () => {
		const mockOnSubmit = jest.fn();
		const mockOnClose = jest.fn();

		render(<PasswordModal onSubmit={mockOnSubmit} onClose={mockOnClose} />);

		const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
		fireEvent.change(passwordInput, { target: { value: 'ValidPassword123!' } });
		fireEvent.keyDown(passwordInput, { key: 'Enter', code: 'Enter', charCode: 13 });

		expect(mockOnSubmit).toHaveBeenCalledWith('ValidPassword123!');
		expect(mockOnClose).toHaveBeenCalledTimes(1);
	});

	it('should not call onSubmit when Enter is pressed with an invalid password', () => {
		const mockOnSubmit = jest.fn();
		const mockOnClose = jest.fn();

		render(<PasswordModal onSubmit={mockOnSubmit} onClose={mockOnClose} />);

		const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
		fireEvent.change(passwordInput, { target: { value: 'short' } });
		fireEvent.keyDown(passwordInput, { key: 'Enter', code: 'Enter', charCode: 13 });

		expect(mockOnSubmit).not.toHaveBeenCalled();
	});
});

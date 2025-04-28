import { fireEvent, render, screen } from '../testUtils';
import Navbar from '../../src/components/Navbar';

/**
 * Test suite for the Navbar component including rendering, user authentication status, and dropdown menu functionality.
 */
describe('Navbar.tsx tests', () => {
	// Logged-in user mock
	const loggedInUser = {
		username: 'testuser',
		role: 'user',
	};

	it('should render the navbar with links', () => {
		render(<Navbar />);

		expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Login/i })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Register/i })).toBeInTheDocument();
	});

	it('should show the username when user is logged in', () => {
		render(<Navbar />, { user: loggedInUser });

		expect(screen.getByText(/Logged in as:/i)).toBeInTheDocument();
	});

	it('should show the login and register buttons when user is not logged in', () => {
		render(<Navbar />);

		expect(screen.getByRole('link', { name: /Login/i })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Register/i })).toBeInTheDocument();
	});

	it('should show the chat button when user is logged in', () => {
		render(<Navbar />, { user: loggedInUser });

		const links = screen.queryAllByRole('link');

		expect(links.length).toBeGreaterThan(2);
	});

	it('should toggle the dropdown menu when the username is clicked', () => {
		render(<Navbar />, { user: loggedInUser });

		const usernameButton = screen.getByText(/Logged in as:/i);
		fireEvent.click(screen.getByText(/Logged in as:/i));

		expect(screen.getByText(/Logout/i)).toBeInTheDocument();

		fireEvent.click(usernameButton);
		expect(screen.queryByText(/Logout/i)).not.toBeInTheDocument();
	});
});

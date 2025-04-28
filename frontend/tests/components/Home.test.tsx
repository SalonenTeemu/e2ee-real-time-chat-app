import { render, screen } from '../testUtils';
import Home from '../../src/components/Home';

/**
 * Test suite for the Home component including rendering and user authentication status.
 */
describe('Home.tsx tests', () => {
	// Logged-in user mock
	const loggedInUser = {
		username: 'testuser',
		role: 'user',
	};

	it('should render the welcome message and buttons', () => {
		render(<Home />);

		expect(screen.getByText(/Welcome to Real-Time Chat App!/i)).toBeInTheDocument();
		expect(screen.getByText(/Chat securely with others in real-time./i)).toBeInTheDocument();
		expect(screen.getByText(/Login or register to start chatting./i)).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Login/i })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Register/i })).toBeInTheDocument();
	});

	it('should show the chat button when user is logged in', () => {
		render(<Home />, { user: loggedInUser });

		expect(screen.getByText(/You are logged in. Start chatting now!/i)).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Go to Chat/i })).toBeInTheDocument();
	});

	it('should show the login and register buttons when user is not logged in', () => {
		render(<Home />);

		expect(screen.getByText(/Login or register to start chatting./i)).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Login/i })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Register/i })).toBeInTheDocument();
	});
});

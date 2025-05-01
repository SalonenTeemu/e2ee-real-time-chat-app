import { render, screen, fireEvent, waitFor } from '../../testUtils';
import Chat from '../../../src/components/chat/Chat';
import { mockFetchSuccess } from '../../mocks/fetchMock';

/**
 * Test suite for the Chat component including rendering, fetching chats, and searching for users.
 * Chat component is not fully tested here as due to its complexity with many dependencies and side effects.
 * The component was tested more manually in the browser.
 */
describe('Chat.tsx tests', () => {
	// Logged-in user mock
	const loggedInUser = {
		id: '12345',
		username: 'testuser',
	};

	beforeEach(() => {
		(global.fetch as jest.Mock) = jest.fn(); // Mock the global fetch function to avoid actual network requests
	});

	it('should render the error message when user is not logged in', () => {
		render(<Chat />);

		expect(screen.getByText(/You need to be logged in to view this page./i)).toBeInTheDocument();
	});

	it('should render the chat component when user is logged in', () => {
		render(<Chat />, loggedInUser);

		expect(screen.getByText(/No active chats/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Search for users to chat with/i })).toBeInTheDocument();
	});

	it('should retrieve chats when the component is mounted', async () => {
		mockFetchSuccess([{ id: '67890', username: 'testuser' }]);

		render(<Chat />, loggedInUser);

		await waitFor(() => {
			expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/chat'), expect.any(Object));
		});
	});

	it('should search for users when the search button is clicked', async () => {
		mockFetchSuccess([{ id: '67890', username: 'testuser' }]);

		render(<Chat />, loggedInUser);

		fireEvent.click(screen.getByRole('button', { name: /Search for users to chat with/i }));
		fireEvent.change(screen.getByPlaceholderText(/Search for users to chat with.../i), {
			target: { value: 'testuser' },
		});
		fireEvent.click(screen.getAllByRole('button', { name: /Search/i })[1]);

		await waitFor(() => {
			expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/user/search?searchTerm=testuser'), expect.any(Object));
		});
	});
});

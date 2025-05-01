import { mockFetchSuccess, mockFetchFailure } from '../mocks/fetchMock';
import { fetchWithAuth } from '../../src/utils/fetch';

/**
 * Test suite for the fetchWithAuth function including success and error cases.
 */
describe('fetch.ts tests', () => {
	// Mock url and functions
	const url = 'https://localhost:5000/api/';
	const logoutMock = jest.fn();
	const notificationMock = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		(global.fetch as jest.Mock) = jest.fn(); // Mock the global fetch function to avoid actual network requests
	});

	it('should call fetch and return the response', async () => {
		mockFetchSuccess({ data: 'test' });

		const result = await fetchWithAuth(url, {}, jest.fn(), jest.fn());

		expect(fetch).toHaveBeenCalled();
		if (result !== null) {
			const resultData = await result.json();
			expect(resultData).toEqual({ data: 'test' });
		} else {
			fail('Result should not be null');
		}
	});

	it('should call addNotification and return null if the response is 429', async () => {
		mockFetchFailure('Error', 429);

		const result = await fetchWithAuth(url, {}, notificationMock, jest.fn());

		expect(notificationMock).toHaveBeenCalled();
		expect(result).toBeNull();
	});

	it('should call addNotification and logout and return null  if the response is 401 or 403', async () => {
		mockFetchFailure('Error', 401);
		mockFetchFailure('Error', 401);

		const result = await fetchWithAuth(url, {}, notificationMock, logoutMock);

		expect(notificationMock).toHaveBeenCalled();
		expect(logoutMock).toHaveBeenCalled();
		expect(result).toBeNull();

		const logoutMock2 = jest.fn();
		const notificationMock2 = jest.fn();
		mockFetchFailure('Error', 403);
		mockFetchFailure('Error', 403);

		const result2 = await fetchWithAuth(url, {}, notificationMock2, logoutMock2);

		expect(notificationMock2).toHaveBeenCalled();
		expect(logoutMock).toHaveBeenCalled();
		expect(result2).toBeNull();
	});
});

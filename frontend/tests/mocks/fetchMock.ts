/**
 * Function to mock the global fetch function for testing purposes returning a successful response.
 *
 * @param {any} data The data to be returned by the mock fetch call
 * @returns A mock implementation of the fetch function that resolves to the provided data
 */
export function mockFetchSuccess(data: any) {
	(fetch as jest.Mock).mockResolvedValueOnce({
		ok: true,
		json: async () => data,
	});
}

/**
 * Function to mock the global fetch function for testing purposes returning a failed response.
 *
 * @param {string} message The error message to be returned by the mock fetch call
 * @param {number} status The HTTP status code to be returned by the mock fetch call
 * @returns A mock implementation of the fetch function that resolves to an error response
 */
export function mockFetchFailure(message: string, status: number) {
	(fetch as jest.Mock).mockResolvedValueOnce({
		ok: false,
		status,
		json: async () => ({ message }),
	});
}

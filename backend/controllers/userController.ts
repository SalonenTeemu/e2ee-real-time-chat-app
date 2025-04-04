import { Response } from 'express';
import { CustomRequest } from '../middleware/user';
import { validateUserSearchTerm } from '../utils/validate';
import { searchUsersByUsername } from '../db/queries/user';

/**
 * Responds to a GET request to search for users by username.
 *
 * @param req The request object
 * @param res The response object
 * @returns The users with usernames that match the search term
 */
export const searchUsers = async (req: CustomRequest, res: Response): Promise<any> => {
	const searchTerm = req.query.searchTerm;
	// Validate the search term
	if (!validateUserSearchTerm(searchTerm as string)) return res.status(400).json({ message: 'Invalid search term' });

	const loggedInUserId = req.user.id;

	try {
		const users = await searchUsersByUsername(searchTerm as string);

		// Filter out the logged-in user from the results
		const filteredUsers = users.filter((user) => user.id !== loggedInUserId);
		res.status(200).json({ message: filteredUsers });
	} catch (error) {
		console.error('Error fetching users:', error);
		res.status(500).json({ message: 'Failed to fetch users' });
	}
};

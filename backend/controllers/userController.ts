import { Response } from 'express';
import { CustomRequest } from '../middleware/user';
import { validateUserSearchTerm } from '../utils/validate';
import { searchUsersByUsername } from '../db/queries/user';
import logger from '../utils/logger';

/**
 * Responds to a GET request to search for users by username.
 *
 * @param {CustomRequest} req The request object
 * @param {Response} res The response object
 * @returns The response
 */
export const searchUsers = async (req: CustomRequest, res: Response): Promise<any> => {
	const searchTerm = req.query.searchTerm;
	const loggedInUserId = req.user.id;

	// Validate the search term
	if (!validateUserSearchTerm(searchTerm as string)) {
		logger.warn(`User search failed for user ${loggedInUserId}, invalid search term: ${searchTerm}`);
		return res.status(400).json({ message: 'Invalid search term' });
	}

	try {
		const users = await searchUsersByUsername(searchTerm as string);

		// Filter out the logged-in user from the results
		const filteredUsers = users.filter((user) => user.id !== loggedInUserId);

		logger.info(`User search successful for user ${loggedInUserId}, search term: ${searchTerm}`);
		res.status(200).json({ message: filteredUsers });
	} catch (error: any) {
		logger.error(`Error searching users for user ${loggedInUserId}: ${error}`);
		res.status(500).json({ message: 'Failed to fetch users' });
	}
};

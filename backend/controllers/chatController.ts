import { Response } from 'express';
import { CustomRequest } from '../middleware/user';
import { getChatByUsers, createChat } from '../db/queries/chat';

/**
 * Responds to a POST request to start a chat.
 *
 * @param req The request object
 * @param res The response object
 * @returns The chat ID
 */
export const startChat = async (req: CustomRequest, res: Response): Promise<any> => {
	const { userId } = req.body;
	const loggedInUserId = req.user.id;

	try {
		const existingChat = await getChatByUsers(loggedInUserId, userId);
		if (existingChat) {
			return res.status(200).json({ message: existingChat.id });
		}

		const chatId = await createChat(loggedInUserId, userId);
		return res.status(201).json({ message: chatId });
	} catch (error) {
		console.error('Error starting chat:', error);
		return res.status(500).json({ message: 'Error starting chat' });
	}
};

import { Response } from 'express';
import { CustomRequest } from '../middleware/user';
import { getChatById } from '../db/queries/chat';
import { getChatMessagesById } from '../db/queries/message';
import { decryptMessage } from '../utils/encryption';
import logger from '../utils/logger';

/**
 * Responds to a GET request to get the chat messages for a chat.
 *
 * @param {CustomRequest} req The request object
 * @param {Response} res The response object
 * @returns The response
 */
export const getChatMessages = async (req: CustomRequest, res: Response): Promise<any> => {
	const userId = req.user.id;
	const chatId = req.params.chatId;
	if (!chatId) {
		logger.warn(`Getting chat messages failed for user ${userId}, chat ID not provided`);
		return res.status(400).json({ message: 'Chat ID is required' });
	}
	try {
		const chat = await getChatById(chatId);
		// Check if the chat exists
		if (!chat) {
			logger.warn(`Getting chat messages failed for user ${userId}, chat not found for ID: ${chatId}`);
			return res.status(404).json({ message: 'Chat not found' });
		}
		// Check that the user is part of the chat
		if (chat.user1_id !== userId && chat.user2_id !== userId) {
			logger.warn(`Getting chat messages failed for user ${userId}, user is not part of the chat with ID: ${chatId}`);
			return res.status(403).json({ message: 'Unauthorized' });
		}
		const messages = await getChatMessagesById(chatId);
		// Decrypt the messages
		const decryptedMessages = messages
			.map((message: any) => {
				try {
					return {
						senderId: message.sender_id,
						createdAt: message.created_at,
						content: decryptMessage(message.content),
					};
				} catch (error: any) {
					logger.error(`Error decrypting message with ID ${message.id}: ${error}`);
					return null; // Exclude messages that cannot be decrypted
				}
			})
			.filter((message) => message !== null); // Remove null entries

		logger.info(`Chat messages retrieved successfully for user ${userId}, chat ID: ${chatId}`);
		return res.status(200).json({ message: decryptedMessages });
	} catch (error: any) {
		logger.error(`Error getting chat messages for user ${userId}: ${error}`);
		return res.status(500).json({ message: 'Error getting chat messages' });
	}
};

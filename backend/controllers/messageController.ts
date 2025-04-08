import { Response } from 'express';
import { CustomRequest } from '../middleware/user';
import { getChatById } from '../db/queries/chat';
import { getChatMessagesById } from '../db/queries/message';
import { decryptMessage } from '../utils/encryption';

/**
 * Responds to a GET request to get the chat messages for a chat.
 *
 * @param req The request object
 * @param res The response object
 * @returns The chat messages
 */
export const getChatMessages = async (req: CustomRequest, res: Response): Promise<any> => {
	const userId = req.user.id;
	const chatId = req.params.chatId;
	if (!chatId) {
		return res.status(400).json({ message: 'Chat ID is required' });
	}
	try {
		const chat = await getChatById(chatId);
		if (!chat) {
			return res.status(404).json({ message: 'Chat not found' });
		}
		if (chat.user1_id !== userId && chat.user2_id !== userId) {
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
				} catch (error) {
					console.warn(`Failed to decrypt message with ID ${message.id}:`, error);
					return null; // Exclude messages that cannot be decrypted
				}
			})
			.filter((message) => message !== null); // Remove null entries
		return res.status(200).json({ message: decryptedMessages });
		return res.status(200).json({ message: decryptedMessages });
	} catch (error) {
		console.error('Error getting chat messages:', error);
		return res.status(500).json({ message: 'Error getting chat messages' });
	}
};

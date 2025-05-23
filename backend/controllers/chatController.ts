import { Response } from 'express';
import { CustomRequest } from '../middleware/user';
import { getChatByUsers, getChatsByUserId, createChat, getChatById } from '../db/queries/chat';
import { getUserById } from '../db/queries/user';
import logger from '../utils/logger';

/**
 * Responds to a POST request to start a chat.
 *
 * @param {CustomRequest} req The request object
 * @param {Response} res The response object
 * @returns The response
 */
export const startChat = async (req: CustomRequest, res: Response): Promise<any> => {
	const { userId } = req.body;
	const loggedInUserId = req.user.id;

	try {
		const existingChat = await getChatByUsers(loggedInUserId, userId);
		const otherUser = await getUserById(userId);
		// Check if the user exists
		if (!otherUser) {
			logger.warn(`Starting chat failed, user not found: ${userId}`);
			return res.status(404).json({ message: 'User not found' });
		}
		// Check if the chat already exists
		if (existingChat) {
			logger.info(`Starting a chat for user ${loggedInUserId} with user ${userId} returned existing chat`);
			return res.status(200).json({ message: { chatId: existingChat.id, username: otherUser.username } });
		}

		const chat = await createChat(loggedInUserId, userId);

		logger.info(`Chat started successfully by user ${loggedInUserId} with user ${userId}`);
		return res.status(201).json({ message: { chatId: chat.id, username: otherUser.username } });
	} catch (error: any) {
		logger.error(`Error starting chat: ${error}`);
		return res.status(500).json({ message: 'Error starting chat' });
	}
};

/**
 * Responds to a GET request to get the chats for a user.
 *
 * @param {CustomRequest} req The request object
 * @param {Response} res The response object
 * @returns The response
 */
export const getUserChats = async (req: CustomRequest, res: Response): Promise<any> => {
	const userId = req.user.id;

	try {
		const chats = await getChatsByUserId(userId);
		// Format the chats to include only the necessary information and sort them by username
		const formattedChats = chats
			.map((chat: any) => ({
				id: chat.id,
				username: chat.other_username,
			}))
			.sort((a, b) => a.username.localeCompare(b.username));

		logger.info(`Chats retrieved successfully for user ${userId}`);
		return res.status(200).json({ message: formattedChats });
	} catch (error: any) {
		logger.error(`Error getting user chats: ${error}`);
		return res.status(500).json({ message: 'Error getting user chats' });
	}
};

/**
 * Responds to a GET request to get a specific chat.
 *
 * @param {CustomRequest} req The request object
 * @param {Response} res The response object
 * @returns The response
 */
export const getChat = async (req: CustomRequest, res: Response): Promise<any> => {
	const { chatId } = req.params;
	const userId = req.user.id;

	try {
		const chat = await getChatById(chatId);
		// Check if the chat exists
		if (!chat) {
			logger.warn(`Retrieving chat failed for user ${userId}, chat not found for ID: ${chatId}`);
			return res.status(404).json({ message: 'Chat not found' });
		}
		// Check that the user is part of the chat
		if (chat.user1_id !== userId && chat.user2_id !== userId) {
			logger.warn(`Retrieving chat failed for user ${userId}, user is not part of the chat with ID: ${chatId}`);
			return res.status(403).json({ message: 'Unauthorized' });
		}
		const otherUsername = await getUserById(chat.user1_id === userId ? chat.user2_id : chat.user1_id);
		// Check if the other user exists
		if (!otherUsername) {
			logger.warn(
				`Retrieving chat failed for user ${userId}, other user ${chat.user1_id === userId ? chat.user2_id : chat.user1_id} not found`
			);
			return res.status(404).json({ message: 'Chat user not found' });
		}

		logger.info(`Chat ${chatId} retrieved successfully for user ${userId}`);
		return res.status(200).json({ message: { chatId: chat.id, username: otherUsername.username } });
	} catch (error: any) {
		logger.error(`Error getting chat: ${error}`);
		return res.status(500).json({ message: 'Error getting chat' });
	}
};

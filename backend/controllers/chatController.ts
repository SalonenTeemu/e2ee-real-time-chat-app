import { Response } from 'express';
import { CustomRequest } from '../middleware/user';
import { getChatByUsers, getChatsByUserId, createChat, getChatById } from '../db/queries/chat';
import { getUserById } from '../db/queries/user';

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
		const otherUser = await getUserById(userId);
		if (!otherUser) {
			return res.status(404).json({ message: 'User not found' });
		}
		if (existingChat) {
			return res.status(200).json({ message: { chatId: existingChat.id, username: otherUser.username } });
		}

		const chat = await createChat(loggedInUserId, userId);
		return res.status(201).json({ message: { chatId: chat.id, username: otherUser.username } });
	} catch (error) {
		console.error('Error starting chat:', error);
		return res.status(500).json({ message: 'Error starting chat' });
	}
};

/**
 * Responds to a GET request to get the chats for a user.
 *
 * @param req The request object
 * @param res The response object
 * @returns The chats for the user
 */
export const getUserChats = async (req: CustomRequest, res: Response): Promise<any> => {
	const userId = req.user.id;

	try {
		const chats = await getChatsByUserId(userId);
		const formattedChats = chats
			.map((chat: any) => ({
				id: chat.id,
				username: chat.other_username,
			}))
			.sort((a, b) => a.username.localeCompare(b.username));
		return res.status(200).json({ message: formattedChats });
	} catch (error) {
		console.error('Error getting user chats:', error);
		return res.status(500).json({ message: 'Error getting user chats' });
	}
};

/**
 * Responds to a GET request to get a specific chat.
 *
 * @param req The request object
 * @param res The response object
 * @returns The chat for the user
 */
export const getChat = async (req: CustomRequest, res: Response): Promise<any> => {
	const { chatId } = req.params;
	const userId = req.user.id;

	try {
		const chat = await getChatById(chatId);
		if (!chat) {
			return res.status(404).json({ message: 'Chat not found' });
		}
		if (chat.user1_id !== userId && chat.user2_id !== userId) {
			return res.status(403).json({ message: 'Unauthorized' });
		}
		res.status(200).json({ message: { chatId: chat.id, username: chat.user1_id === userId ? chat.user2_id : chat.user1_id } });
	} catch (error) {
		console.error('Error getting chat:', error);
		return res.status(500).json({ message: 'Error getting chat' });
	}
};

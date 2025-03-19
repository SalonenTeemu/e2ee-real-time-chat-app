import db from '../knex';
import { chatTableName } from '../initDB';

/**
 * Returns a chat by the user IDs.
 *
 * @param userId1 The user ID of the first user
 * @param userId2 The user ID of the second user
 * @returns The chat if it exists
 */
export const getChatByUsers = async (userId1: string, userId2: string) => {
	try {
		return await db(chatTableName).where({ user1_id: userId1, user2_id: userId2 }).orWhere({ user1_id: userId2, user2_id: userId1 }).first();
	} catch (error) {
		console.error('Error getting chat:', error);
		throw new Error(`Error getting chat: ${error}`);
	}
};

/**
 * Create a chat.
 *
 * @param userId1 The user ID of the first user
 * @param userId2 The user ID of the second user
 * @returns The chat ID
 */
export const createChat = async (userId1: string, userId2: string) => {
	try {
		const chat = await db(chatTableName).insert({ user1_id: userId1, user2_id: userId2 }).returning('id');
		return chat[0];
	} catch (error) {
		console.error('Error creating chat:', error);
		throw new Error(`Error creating chat: ${error}`);
	}
};

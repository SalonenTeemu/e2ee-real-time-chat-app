import db from '../knex';
import { publicKeyTableName } from '../initDB';
import logger from '../../utils/logger';

/**
 * Save the user's public key.
 *
 * @param {string} userId The user ID
 * @param {string} publicKey The public key to save
 * @throws {Error} If there is an issue saving the public key
 */
export const saveUserPublicKey = async (userId: string, publicKey: string) => {
	try {
		await db(publicKeyTableName).insert({ user_id: userId, public_key: publicKey });
	} catch (error: any) {
		logger.error(`Error saving public key to DB for user ${userId}: ${error}`);
		throw new Error(`Error saving public key: ${error}`);
	}
};

/**
 * Retrieve the public key of a user.
 *
 * @param {string} userId The user ID'
 * @returns {string | null} The public key of the user if it exists, otherwise null
 * @throws {Error} If there is an issue retrieving the public key
 */
export const getPublicKeyByUserId = async (userId: string) => {
	try {
		const record = await db(publicKeyTableName).where({ user_id: userId }).first();
		if (!record) return null;
		return record.public_key;
	} catch (error: any) {
		logger.error(`Error getting public key from DB for user ${userId}: ${error}`);
		throw new Error(`Error getting public key: ${error}`);
	}
};

import db from '../knex';
import { publicKeyTableName } from '../initDB';

/**
 * Save the user's public key.
 *
 * @param {string} userId The user ID
 * @param {string} publicKey The public key to save
 */
export const saveUserPublicKey = async (userId: string, publicKey: string) => {
	await db(publicKeyTableName).insert({ user_id: userId, public_key: publicKey });
};

/**
 * Retrieve the public key of a user.
 *
 * @param {string} userId The user ID'
 * @returns {string | null} The public key of the user if it exists, otherwise null
 */
export const getPublicKeyByUserId = async (userId: string) => {
	const record = await db(publicKeyTableName).where({ user_id: userId }).first();
	if (!record) return null;
	return record.public_key;
};

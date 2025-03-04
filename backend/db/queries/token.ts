import db from '../knex';
import { refreshTokenTableName } from '../initDB';

/**
 * Add a refresh token to the database.
 *
 * @param user_id The user ID
 * @param token The refresh token
 * @returns The refresh token
 */
export async function addRefreshToken(user_id: string, token: string) {
	try {
		const expires_at = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
		return await db(refreshTokenTableName).insert({ user_id, token, expires_at });
	} catch (error) {
		console.error('Error inserting record:', error);
		throw new Error(`DB error - Error inserting  refresh token: ${error}`);
	}
}

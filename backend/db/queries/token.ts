import db from '../knex';
import { refreshTokenTableName } from '../initDB';

/**
 * Add a refresh token to the database.
 *
 * @param user_id The user ID
 * @param token The refresh token
 * @returns The refresh token
 */
export const addRefreshToken = async (user_id: string, token: string) => {
	try {
		const expires_at = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
		return await db(refreshTokenTableName).insert({ user_id, token, expires_at });
	} catch (error) {
		console.error('Error inserting record:', error);
		throw new Error(`Error inserting  refresh token: ${error}`);
	}
};

/**
 * Retrieve a refresh token from the database.
 *
 * @param token The refresh token
 * @returns The refresh token
 */
export const getRefreshToken = async (token: string) => {
	try {
		return await db(refreshTokenTableName).where({ token }).first();
	} catch (error) {
		console.error('Error getting refresh token:', error);
		throw new Error(`Error getting refresh token: ${error}`);
	}
};

/**
 * Revoke a refresh token.
 *
 * @param token The refresh token
 * @returns The refresh token
 */
export const revokeRefreshToken = async (token: string) => {
	try {
		return await db(refreshTokenTableName).where({ token }).update({ is_revoked: true });
	} catch (error) {
		console.error('Error revoking refresh token:', error);
		throw new Error(`Error revoking refresh token: ${error}`);
	}
};

import db from '../knex';
import { refreshTokenTableName } from '../initDB';
import logger from '../../utils/logger';

/**
 * Saves a refresh token to the database.
 *
 * @param {string} user_id The user ID
 * @param {string} token The refresh token
 * @returns {any} The inserted refresh token record
 * @throws {Error} If there is an issue inserting the token
 */
export const addRefreshToken = async (user_id: string, token: string) => {
	try {
		// Set the expiration date to 7 days from now
		const expires_at = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
		return await db(refreshTokenTableName).insert({ user_id, token, expires_at });
	} catch (error: any) {
		logger.error(`Error inserting refresh token to DB for user ${user_id}: ${error}`);
		throw new Error(`Error inserting  refresh token: ${error}`);
	}
};

/**
 * Retrieve a refresh token from the database.
 *
 * @param {string} token The refresh token
 * @returns {any} The refresh token record if it exists, otherwise null
 * @throws {Error} If there is an issue retrieving the token
 */
export const getRefreshToken = async (token: string) => {
	try {
		return await db(refreshTokenTableName).where({ token }).first();
	} catch (error: any) {
		logger.error(`Error getting refresh token from DB: ${error}`);
		throw new Error(`Error getting refresh token: ${error}`);
	}
};

/**
 * Revoke a refresh token.
 *
 * @param {string} token The refresh token to revoke
 * @throws {Error} If there is an issue revoking the token
 */
export const revokeRefreshToken = async (token: string) => {
	try {
		await db(refreshTokenTableName).where({ token }).update({ is_revoked: true });
	} catch (error: any) {
		logger.error(`Error revoking refresh token in DB: ${error}`);
		throw new Error(`Error revoking refresh token: ${error}`);
	}
};

/**
 * Delete expired and revoked refresh tokens from the database.
 */
export const deleteExpiredAndRevokedTokens = async () => {
	try {
		await db(refreshTokenTableName).where('expires_at', '<', new Date()).orWhere('is_revoked', true).del();
	} catch (error: any) {
		logger.error(`Error deleting expired and revoked tokens from DB: ${error}`);
		throw new Error(`Error deleting expired and revoked tokens: ${error}`);
	}
};

import cron from 'node-cron';
import { deleteExpiredAndRevokedTokens } from '../db/queries/token';
import logger from '../utils/logger';

/**
 * A cron job that runs every day 2:00 at night to delete expired and revoked refresh tokens from the database.
 */
cron.schedule('0 2 * * *', async () => {
	logger.info('Running refresh token cleanup job...');
	try {
		await deleteExpiredAndRevokedTokens();
	} catch (error: any) {
		logger.error(`Error during refresh token cleanup: ${error.message}`);
	}
});

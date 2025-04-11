import cron from 'node-cron';
import { deleteExpiredAndRevokedTokens } from '../db/queries/token';

/**
 * A cron job that runs every day at 2 AM to delete expired and revoked refresh tokens from the database.
 */
cron.schedule('0 2 * * *', async () => {
	console.log('Running refresh token cleanup job...');
	try {
		await deleteExpiredAndRevokedTokens();
	} catch (error) {
		console.error('Error during refresh token cleanup:', error);
	}
});

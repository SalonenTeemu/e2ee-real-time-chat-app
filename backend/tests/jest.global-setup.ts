// Set environment variables for test database schema
process.env.DB_SCHEMA = 'chat-app-test';
process.env.DB_NAME = 'chat';

import { initializeDatabase } from '../db/initDB';

/**
 * Global setup script for Jest tests.
 * Initializes the test database schema and tables before running tests.
 */
export default async () => {
	try {
		await initializeDatabase();
		console.log('Test database schema initialized successfully for Jest tests');
	} catch (error: any) {
		console.error('Error with Jest global setup:', error);
	}
};

// Set environment variables for test database schema
process.env.DB_SCHEMA = 'chat-app-test';
process.env.DB_NAME = 'chat';

import { initializeDatabase } from '../db/initDB';
import request from 'supertest';
import app from '../index';

/**
 * Global setup for Jest tests.
 * Initializes the test database schema and tables and adds test users before running tests.
 */
export default async () => {
	try {
		await initializeDatabase();
		console.log('Test database schema initialized successfully for Jest tests');

		// Add test users before running tests
		const response = await request(app).post('/api/auth/register').send({ username: 'user1', password: 'Password123-' });
		const response2 = await request(app).post('/api/auth/register').send({ username: 'user2', password: 'Password123-' });
		const response3 = await request(app).post('/api/auth/register').send({ username: 'user3', password: 'Password123-' });

		if (!response || !response2 || !response3) {
			throw new Error('Failed to add test users before running tests');
		}
	} catch (error: any) {
		console.error('Error with Jest global setup:', error);
	}
};

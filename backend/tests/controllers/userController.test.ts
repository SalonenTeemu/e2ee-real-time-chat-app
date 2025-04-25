import request from 'supertest';
import app from '../../index';
import db from '../../db/knex';
import { refreshTokenTableName, publicKeyTableName } from '../../db/initDB';

/**
 * Test suite for the user-related routes, including searching for users.
 */
describe('userController.ts tests', () => {
	// Clear the refresh token table before each test to ensure a clean state
	beforeEach(async () => {
		await db(refreshTokenTableName).truncate();
	});

	it('should search for users', async () => {
		const response = await request(app).post('/api/auth/login').send({ username: 'user1', password: 'Password123-' });
		expect(response.status).toBe(200);

		const response2 = await request(app).post('/api/auth/login').send({ username: 'user2', password: 'Password123-' });
		expect(response2.status).toBe(200);

		await db(publicKeyTableName).truncate();

		const savePublicKeyResponse = await request(app)
			.post('/api/key')
			.send({ publicKey: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=' })
			.set('Cookie', response2.headers['set-cookie']);
		expect(savePublicKeyResponse.status).toBe(200);

		const searchResponse = await request(app).get('/api/user/search?searchTerm=user').set('Cookie', response.headers['set-cookie']);
		expect(searchResponse.status).toBe(200);
		expect(searchResponse.body.message).toBeInstanceOf(Array);
		expect(searchResponse.body.message.length).toBeGreaterThan(0);
		expect(searchResponse.body.message[0]).toHaveProperty('id');
		expect(searchResponse.body.message[0]).toHaveProperty('username');
	});

	it('should fail to search for users with an invalid search term', async () => {
		const response = await request(app).post('/api/auth/login').send({ username: 'user1', password: 'Password123-' });
		expect(response.status).toBe(200);

		const searchResponse = await request(app).get('/api/user/search?searchTerm=').set('Cookie', response.headers['set-cookie']);
		expect(searchResponse.status).toBe(400);
		expect(searchResponse.body.message).toBe('Invalid search term');

		const invalidTerm = 'a'.repeat(51);

		const searchResponse2 = await request(app).get(`/api/user/search?searchTerm=${invalidTerm}`).set('Cookie', response.headers['set-cookie']);
		expect(searchResponse2.status).toBe(400);
		expect(searchResponse2.body.message).toBe('Invalid search term');
	});
});

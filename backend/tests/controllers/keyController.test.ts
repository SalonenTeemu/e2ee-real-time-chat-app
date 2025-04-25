import request from 'supertest';
import app from '../../index';
import db from '../../db/knex';
import { getUserByUsername } from '../../db/queries/user';
import { refreshTokenTableName, publicKeyTableName } from '../../db/initDB';

/**
 * Test suite for the key-related routes, including saving and retrieving public keys.
 */
describe('keyController.ts tests', () => {
	// Clear the refresh token table before each test to ensure a clean state
	beforeEach(async () => {
		await db(refreshTokenTableName).truncate();
	});

	it('should fail to save public key when not logged in', async () => {
		const publicKeyResponse = await request(app).post('/api/key').send({ publicKey: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=' });
		expect(publicKeyResponse.status).toBe(403);
		expect(publicKeyResponse.body.message).toBe('Access denied');
	});

	it('should fail to save public key when public key is invalid', async () => {
		const response = await request(app).post('/api/auth/login').send({ username: 'user1', password: 'Password123-' });
		expect(response.status).toBe(200);

		await db(publicKeyTableName).truncate();

		const publicKeyResponse = await request(app)
			.post('/api/key')
			.send({ publicKey: 'invalid_public_key' })
			.set('Cookie', response.headers['set-cookie']);
		expect(publicKeyResponse.status).toBe(400);
	});

	it('should save public key', async () => {
		const response = await request(app).post('/api/auth/login').send({ username: 'user1', password: 'Password123-' });
		expect(response.status).toBe(200);

		const publicKeyResponse = await request(app)
			.post('/api/key')
			.send({ publicKey: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=' })
			.set('Cookie', response.headers['set-cookie']);
		expect(publicKeyResponse.status).toBe(200);
		expect(publicKeyResponse.body.message).toBe('Public key saved successfully');

		const response2 = await request(app).post('/api/auth/login').send({ username: 'user2', password: 'Password123-' });
		expect(response2.status).toBe(200);

		const publicKeyResponse2 = await request(app)
			.post('/api/key')
			.send({ publicKey: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABBB=' })
			.set('Cookie', response2.headers['set-cookie']);
		expect(publicKeyResponse2.status).toBe(200);
		expect(publicKeyResponse2.body.message).toBe('Public key saved successfully');
	});

	it('should fail to save public key when it already exists', async () => {
		const response = await request(app).post('/api/auth/login').send({ username: 'user1', password: 'Password123-' });
		expect(response.status).toBe(200);

		const publicKeyResponse = await request(app)
			.post('/api/key')
			.send({ publicKey: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=' })
			.set('Cookie', response.headers['set-cookie']);
		expect(publicKeyResponse.status).toBe(400);
		expect(publicKeyResponse.body.message).toBe('Public key already exists');
	});

	it('should get recipient public key', async () => {
		const response = await request(app).post('/api/auth/login').send({ username: 'user1', password: 'Password123-' });
		expect(response.status).toBe(200);

		const otherUserId = (await getUserByUsername('user2')).id;
		const chatResponse = await request(app).post('/api/chat/start').send({ userId: otherUserId }).set('Cookie', response.headers['set-cookie']);
		expect([200, 201].includes(chatResponse.status)).toBe(true);
		expect(chatResponse.body.message).toHaveProperty('chatId');

		const keyResponse = await request(app)
			.get(`/api/key/recipient/${chatResponse.body.message.chatId}`)
			.set('Cookie', response.headers['set-cookie']);
		expect(keyResponse.status).toBe(200);
		expect(keyResponse.body).toHaveProperty('publicKey');
		expect(keyResponse.body.publicKey).toBeDefined();
	});

	it('should fail to get recipient public key when chat is not found', async () => {
		const response = await request(app).post('/api/auth/login').send({ username: 'user1', password: 'Password123-' });
		expect(response.status).toBe(200);

		const keyResponse = await request(app)
			.get('/api/key/recipient/3f2504e0-4f89-11d3-9a0c-0305e82c3301')
			.set('Cookie', response.headers['set-cookie']);
		expect(keyResponse.status).toBe(404);
		expect(keyResponse.body.message).toBe('Chat not found');
	});
});

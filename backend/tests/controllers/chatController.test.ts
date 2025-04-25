import request from 'supertest';
import app from '../../index';
import db from '../../db/knex';
import { getUserByUsername } from '../../db/queries/user';
import { refreshTokenTableName } from '../../db/initDB';

/**
 * Test suite for the chat-related routes, including starting a chat, getting user chats, and getting chat by ID.
 */
describe('chatController.ts tests', () => {
	// Clear the refresh token table before each test to ensure a clean state
	beforeEach(async () => {
		await db(refreshTokenTableName).truncate();
	});

	it('should start a chat', async () => {
		const response = await request(app).post('/api/auth/login').send({ username: 'user1', password: 'Password123-' });
		expect(response.status).toBe(200);

		const otherUser = await getUserByUsername('user2');
		const chatResponse = await request(app).post('/api/chat/start').send({ userId: otherUser.id }).set('Cookie', response.headers['set-cookie']);

		expect([200, 201].includes(chatResponse.status)).toBe(true);
		expect(chatResponse.body.message).toHaveProperty('chatId');
		expect(chatResponse.body.message).toHaveProperty('username', 'user2');
	});

	it('should fail to start a chat with a non-existent user', async () => {
		const response = await request(app).post('/api/auth/login').send({ username: 'user1', password: 'Password123-' });
		expect(response.status).toBe(200);

		const chatResponse = await request(app)
			.post('/api/chat/start')
			.send({ userId: '3f2504e0-4f89-11d3-9a0c-0305e82c3301' })
			.set('Cookie', response.headers['set-cookie']);
		expect(chatResponse.status).toBe(404);
		expect(chatResponse.body.message).toBe('User not found');
	});

	it('should get user chats', async () => {
		const response = await request(app).post('/api/auth/login').send({ username: 'user1', password: 'Password123-' });
		expect(response.status).toBe(200);

		const chatResponse = await request(app).get('/api/chat').set('Cookie', response.headers['set-cookie']);
		expect(chatResponse.status).toBe(200);
		expect(chatResponse.body.message).toBeInstanceOf(Array);
		expect(chatResponse.body.message.length).toBeGreaterThan(0);
		expect(chatResponse.body.message[0]).toHaveProperty('id');
		expect(chatResponse.body.message[0]).toHaveProperty('username');
	});

	it('should fail to get user chats when not logged in', async () => {
		const logoutResponse = await request(app).post('/api/auth/logout');
		expect(logoutResponse.status).toBe(200);

		const chatResponse = await request(app).get('/api/chat');
		expect(chatResponse.status).toBe(403);
		expect(chatResponse.body.message).toBe('Access denied');
	});

	it('should get chat by ID', async () => {
		const response = await request(app).post('/api/auth/login').send({ username: 'user1', password: 'Password123-' });
		expect(response.status).toBe(200);

		const chatResponse = await request(app).get('/api/chat').set('Cookie', response.headers['set-cookie']);
		expect(chatResponse.status).toBe(200);

		const chatId = chatResponse.body.message[0].id;
		const chatByIdResponse = await request(app).get(`/api/chat/${chatId}`).set('Cookie', response.headers['set-cookie']);
		expect(chatByIdResponse.status).toBe(200);
		expect(chatByIdResponse.body.message).toHaveProperty('chatId', chatId);
		expect(chatByIdResponse.body.message).toHaveProperty('username', 'user2');
	});

	it('should fail to get chat by ID with invalid chat ID', async () => {
		const response = await request(app).post('/api/auth/login').send({ username: 'user1', password: 'Password123-' });
		expect(response.status).toBe(200);

		const chatResponse = await request(app).get('/api/chat/3f2504e0-4f89-11d3-9a0c-0305e82c3301').set('Cookie', response.headers['set-cookie']);
		expect(chatResponse.status).toBe(404);
		expect(chatResponse.body.message).toBe('Chat not found');
	});

	it('should fail to get chat by ID when not logged in', async () => {
		const chatResponse = await request(app).get('/api/chat/invalid-chat-id');
		expect(chatResponse.status).toBe(403);
		expect(chatResponse.body.message).toBe('Access denied');
	});
});

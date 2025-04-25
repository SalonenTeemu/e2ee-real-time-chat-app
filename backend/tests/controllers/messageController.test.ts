import request from 'supertest';
import app from '../../index';
import db from '../../db/knex';
import { getUserByUsername } from '../../db/queries/user';
import { refreshTokenTableName } from '../../db/initDB';

/**
 * Test suite for the message-related routes, including getting chat messages.
 */
describe('messageController.ts tests', () => {
	// Clear the refresh token table before each test to ensure a clean state
	beforeEach(async () => {
		await db(refreshTokenTableName).truncate();
	});

	it('should get chat messages', async () => {
		const response = await request(app).post('/api/auth/login').send({ username: 'user1', password: 'Password123-' });
		expect(response.status).toBe(200);

		const otherUser = await getUserByUsername('user2');
		const chatResponse = await request(app).post('/api/chat/start').send({ userId: otherUser.id }).set('Cookie', response.headers['set-cookie']);

		expect([200, 201].includes(chatResponse.status)).toBe(true);
		expect(chatResponse.body.message).toHaveProperty('chatId');
		expect(chatResponse.body.message).toHaveProperty('username', 'user2');

		const chatId = chatResponse.body.message.chatId;
		const messagesResponse = await request(app).get(`/api/message/${chatId}`).set('Cookie', response.headers['set-cookie']);
		expect(messagesResponse.status).toBe(200);
		expect(messagesResponse.body.message).toBeInstanceOf(Array);
	});

	it('should fail to get chat messages when not logged in', async () => {
		const messagesResponse = await request(app).get('/api/message/3f2504e0-4f89-11d3-9a0c-0305e82c3301');
		expect(messagesResponse.status).toBe(403);
		expect(messagesResponse.body.message).toBe('Access denied');
	});

	it('should fail to get chat messages for a non-existent chat', async () => {
		const response = await request(app).post('/api/auth/login').send({ username: 'user1', password: 'Password123-' });
		expect(response.status).toBe(200);

		const messagesResponse = await request(app)
			.get('/api/message/3f2504e0-4f89-11d3-9a0c-0305e82c3301')
			.set('Cookie', response.headers['set-cookie']);
		expect(messagesResponse.status).toBe(404);
		expect(messagesResponse.body.message).toBe('Chat not found');
	});
});

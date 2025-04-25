import request from 'supertest';
import app from '../../index';
import db from '../../db/knex';
import { refreshTokenTableName } from '../../db/initDB';

/**
 * Test suite for the auth-related routes, including registration, login, logout, token refresh, getting user profile and verifying password.
 */
describe('authController.ts tests', () => {
	// Clear the refresh token table before each test to ensure a clean state
	beforeEach(async () => {
		await db(refreshTokenTableName).truncate();
	});

	it('should register a new user', async () => {
		const response = await request(app).post('/api/auth/register').send({ username: 'testuser', password: 'Testpassword123-' });
		expect(response.status).toBe(201);
		expect(response.body.message).toBe('User registered successfully');
	});

	it('should fail to register an existing user', async () => {
		const response = await request(app).post('/api/auth/register').send({ username: 'testuser', password: 'Testpassword123-' });
		expect(response.status).toBe(400);
		expect(response.body.message).toBe('Username already exists');
	});

	it('should fail to register with invalid data', async () => {
		const response = await request(app).post('/api/auth/register').send({ username: 'testuser', password: 'short' });
		expect(response.status).toBe(400);
	});

	it('should log in a user', async () => {
		const response = await request(app).post('/api/auth/login').send({ username: 'testuser', password: 'Testpassword123-' });

		expect(response.status).toBe(200);
		expect(response.headers['set-cookie']).toBeDefined();

		const cookies = Array.isArray(response.headers['set-cookie']) ? response.headers['set-cookie'] : [response.headers['set-cookie']];

		const accessTokenCookie = cookies.find((cookie: string) => cookie.startsWith('access_token='));
		const refreshTokenCookie = cookies.find((cookie: string) => cookie.startsWith('refresh_token='));

		expect(accessTokenCookie).toBeDefined();
		expect(refreshTokenCookie).toBeDefined();

		expect(accessTokenCookie).toMatch(/access_token=[^;]+/);
		expect(refreshTokenCookie).toMatch(/refresh_token=[^;]+/);

		expect(response.body.message).toBe('Login successful, but public key is missing');
	});

	it('should fail to log in with incorrect password', async () => {
		const response = await request(app).post('/api/auth/login').send({ username: 'testuser', password: 'WrongPassword123-' });
		expect(response.status).toBe(401);
		expect(response.body.message).toBe('Incorrect password');
	});

	it('should fail to log in with non-existent username', async () => {
		const response = await request(app).post('/api/auth/login').send({ username: 'nonexistentuser', password: 'Testpassword123-' });
		expect(response.status).toBe(401);
		expect(response.body.message).toBe('Username not found');
	});

	it('should log out a user', async () => {
		const loginResponse = await request(app).post('/api/auth/login').send({ username: 'testuser', password: 'Testpassword123-' });
		expect(loginResponse.status).toBe(200);

		const logoutResponse = await request(app).post('/api/auth/logout');
		expect(logoutResponse.status).toBe(200);
		expect(logoutResponse.body.message).toBe('Logout successful');
	});

	it('should get user profile', async () => {
		const loginResponse = await request(app).post('/api/auth/login').send({ username: 'testuser', password: 'Testpassword123-' });
		expect(loginResponse.status).toBe(200);
		expect(loginResponse.headers['set-cookie']).toBeDefined();

		const userProfileResponse = await request(app).get('/api/auth/me').set('Cookie', loginResponse.headers['set-cookie']);
		expect(userProfileResponse.status).toBe(200);
		expect(userProfileResponse.body.message).toHaveProperty('id');
		expect(userProfileResponse.body.message).toHaveProperty('username', 'testuser');
		expect(userProfileResponse.body.message).toHaveProperty('role', 'user');
	});

	it('should fail to get user profile without authentication', async () => {
		const response = await request(app).get('/api/auth/me');
		expect(response.status).toBe(403);
		expect(response.body.message).toBe('Access denied');
	});

	it('should refresh tokens', async () => {
		const loginResponse = await request(app).post('/api/auth/login').send({ username: 'testuser', password: 'Testpassword123-' });
		expect(loginResponse.status).toBe(200);
		expect(loginResponse.headers['set-cookie']).toBeDefined();

		await new Promise((resolve) => setTimeout(resolve, 1000));

		const refreshResponse = await request(app).post('/api/auth/refresh').set('Cookie', loginResponse.headers['set-cookie']);

		expect(refreshResponse.status).toBe(200);
		expect(refreshResponse.body.message).toBe('Tokens refreshed');

		const cookies = Array.isArray(refreshResponse.headers['set-cookie'])
			? refreshResponse.headers['set-cookie']
			: [refreshResponse.headers['set-cookie']];

		const accessTokenCookie = cookies.find((cookie: string) => cookie.startsWith('access_token='));
		const refreshTokenCookie = cookies.find((cookie: string) => cookie.startsWith('refresh_token='));

		expect(accessTokenCookie).toBeDefined();
		expect(refreshTokenCookie).toBeDefined();

		expect(accessTokenCookie).toMatch(/access_token=[^;]+/);
		expect(refreshTokenCookie).toMatch(/refresh_token=[^;]+/);
	});

	it('should fail to refresh tokens without authentication', async () => {
		const response = await request(app).post('/api/auth/refresh');
		expect(response.status).toBe(401);
		expect(response.body.message).toBe('Unauthorized');
	});

	it('should verify password', async () => {
		const loginResponse = await request(app).post('/api/auth/login').send({ username: 'testuser', password: 'Testpassword123-' });
		expect(loginResponse.status).toBe(200);
		expect(loginResponse.headers['set-cookie']).toBeDefined();

		const verifyPasswordResponse = await request(app)
			.post('/api/auth/verify-password')
			.set('Cookie', loginResponse.headers['set-cookie'])
			.send({ password: 'Testpassword123-' });
		expect(verifyPasswordResponse.status).toBe(200);
		expect(verifyPasswordResponse.body.message).toBe('Password is valid');
	});

	it('should fail to verify password with incorrect password', async () => {
		const loginResponse = await request(app).post('/api/auth/login').send({ username: 'testuser', password: 'Testpassword123-' });
		expect(loginResponse.status).toBe(200);
		expect(loginResponse.headers['set-cookie']).toBeDefined();

		const verifyPasswordResponse = await request(app)
			.post('/api/auth/verify-password')
			.set('Cookie', loginResponse.headers['set-cookie'])
			.send({ password: 'WrongPassword123-' });
		expect(verifyPasswordResponse.status).toBe(401);
		expect(verifyPasswordResponse.body.message).toBe('Incorrect password');
	});
});

import request from 'supertest';
import app from '../index';

describe('GET /api/auth/logout', () => {
	it('should return 200 OK', async () => {
		const res = await request(app).post('/api/auth/logout');
		expect(res.status).toBe(200);
		expect(res.body).toEqual({
			message: 'Logout successful',
		});
	});
});

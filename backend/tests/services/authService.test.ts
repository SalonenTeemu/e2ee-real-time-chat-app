import db from '../../db/knex';
import { refreshTokenTableName } from '../../db/initDB';
import { revokeRefreshToken } from '../../db/queries/token';
import { createTokens, verifyAccessToken, verifyRefreshToken } from '../../services/authService';
import { getUserByUsername } from '../../db/queries/user';

/**
 * Test suite for the authService, including token creation and verification.
 */
describe('authService.ts tests', () => {
	// Clear the refresh token table before each test to ensure a clean state
	beforeEach(async () => {
		await db(refreshTokenTableName).truncate();
		console.log(refreshTokenTableName);
	});

	it('should create access and refresh tokens', async () => {
		const user = await getUserByUsername('user1');
		const payload = { id: user.id, role: user.role };
		const tokens = await createTokens(payload);
		expect(tokens).toHaveProperty('accessToken');
		expect(tokens).toHaveProperty('refreshToken');
		expect(typeof tokens.accessToken).toBe('string');
		expect(typeof tokens.refreshToken).toBe('string');
	});

	it('should verify access and refresh tokens', async () => {
		const user = await getUserByUsername('user2');
		const payload = { id: user.id, role: user.role };
		const tokens = await createTokens(payload);
		const verifiedUser = verifyAccessToken(tokens.accessToken);
		expect(verifiedUser).toHaveProperty('id', user.id);
		expect(verifiedUser).toHaveProperty('role', user.role);
		expect(verifiedUser?.id).toBe(user.id);
		expect(verifiedUser?.role).toBe(user.role);

		const verifiedRefreshUser = await verifyRefreshToken(tokens.refreshToken);
		expect(verifiedRefreshUser).toHaveProperty('id', user.id);
		expect(verifiedRefreshUser).toHaveProperty('role', user.role);
		expect(verifiedRefreshUser?.id).toBe(user.id);
		expect(verifiedRefreshUser?.role).toBe(user.role);
	});

	it('should return null for invalid access and refresh tokens', async () => {
		const invalidAccessToken = 'invalidtoken';
		const verifiedUser = await verifyAccessToken(invalidAccessToken);
		expect(verifiedUser).toBeNull();

		const invalidRefreshToken = 'invalidtoken';
		const verifiedRefreshUser = await verifyRefreshToken(invalidRefreshToken);
		expect(verifiedRefreshUser).toBeNull();
	});

	it('should return null for revoked refresh token', async () => {
		const user = await getUserByUsername('user3');
		const payload = { id: user.id, role: user.role };
		const tokens = await createTokens(payload);
		await revokeRefreshToken(tokens.refreshToken);
		const verifiedUser = await verifyRefreshToken(tokens.refreshToken);
		expect(verifiedUser).toBeNull();
	});
});

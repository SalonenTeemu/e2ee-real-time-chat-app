import { mockFetchSuccess, mockFetchFailure } from '../../mocks/fetchMock';
import { keyManager } from '../../../src/services/key/keyManager';
import { getFromDB } from '../../../src/utils/db';
import { showPasswordModal } from '../../../src/components/auth-recovery/PasswordModal';
import sodium from 'libsodium-wrappers';

// Mock the PasswordModal component
jest.mock('../../../src/components/auth-recovery/PasswordModal', () => ({
	showPasswordModal: jest.fn(),
}));

// Mock the libsodium-wrappers library to avoid actual cryptographic operations
jest.mock('libsodium-wrappers', () => ({
	ready: Promise.resolve(),
	to_base64: jest.fn(() => 'mockBase64'),
	from_base64: jest.fn(() => new Uint8Array([1, 2, 3])),
	crypto_secretbox_open_easy: jest.fn(() => new Uint8Array([1, 2, 3])),
	crypto_scalarmult: jest.fn(() => new Uint8Array(32)),
	crypto_kdf_derive_from_key: jest.fn(() => new Uint8Array(32)),
	crypto_generichash: jest.fn(() => new Uint8Array(8)),
	memzero: jest.fn(),
}));

/**
 * Test suite for the keyManager module including key retrieval, decryption, caching and error handling.
 */
describe('keyManager.ts tests', () => {
	// Mock chat and user IDs
	const chatId = 'chat123';
	const userId = 'user123';

	beforeAll(() => {
		const subtleMock = {
			importKey: jest.fn().mockResolvedValue('mockImportedKey'),
			deriveKey: jest.fn().mockResolvedValue('mockDerivedKey'),
			exportKey: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
			encrypt: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
			decrypt: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
		};

		Object.defineProperty(globalThis, 'crypto', {
			value: {
				subtle: subtleMock,
				getRandomValues: (arr: Uint8Array) => arr.fill(1),
			},
		});
	});

	beforeEach(() => {
		// Clear the mocks and reset the state before each test
		jest.clearAllMocks();
		(keyManager as any).userDecryptedPrivateKey = null;
		(keyManager as any).sharedKeyCache = {};
		(global.fetch as jest.Mock) = jest.fn(); // Mock the global fetch function to avoid actual network requests
	});

	it('should return the decrypted private key if already cached', async () => {
		(keyManager as any).userDecryptedPrivateKey = new Uint8Array([1, 2, 3]);

		const key = await keyManager.getDecryptedPrivateKey('user123');

		expect(key).toEqual(new Uint8Array([1, 2, 3]));
	});

	it('should fetch and decrypt the private key if not cached', async () => {
		(getFromDB as jest.Mock).mockResolvedValue({
			salt: 'saltBase64',
			nonce: 'nonceBase64',
			data: 'dataBase64',
		});

		(sodium.crypto_secretbox_open_easy as jest.Mock).mockReturnValue(new Uint8Array([9, 8, 7]));

		const result = await keyManager.getDecryptedPrivateKey('user123', 'password123');

		expect(result).toBeInstanceOf(Uint8Array);
		expect(getFromDB).toHaveBeenCalled();
		expect(result).toEqual(new Uint8Array([9, 8, 7]));
	});

	it('should throw an error if private key decryption fails', async () => {
		mockFetchSuccess({ publicKey: 'publicKeyBase64' });

		(sodium.from_base64 as jest.Mock).mockReturnValue(new Uint8Array([4, 5, 6]));

		const decryptSpy = jest.spyOn(keyManager, 'getDecryptedPrivateKey').mockRejectedValue(new Error('IncorrectPassword'));

		await expect(keyManager.getSharedKey(chatId, userId)).rejects.toThrow('IncorrectPassword');

		decryptSpy.mockRestore();
	});

	it('should successfully retrieve shared key and cache it', async () => {
		mockFetchSuccess({ publicKey: 'publicKeyBase64' });

		(sodium.from_base64 as jest.Mock).mockReturnValue(new Uint8Array([4, 5, 6]));
		(getFromDB as jest.Mock).mockResolvedValue({
			salt: 'saltBase64',
			nonce: 'nonceBase64',
			data: 'dataBase64',
		});
		(sodium.crypto_secretbox_open_easy as jest.Mock).mockReturnValue(new Uint8Array([7, 8, 9]));

		(showPasswordModal as jest.Mock).mockResolvedValue('password123');

		const sharedKey = await keyManager.getSharedKey(chatId, userId);

		expect(sharedKey).toEqual(new Uint8Array(32));
		expect(fetch).toHaveBeenCalledWith(expect.stringContaining(`/api/key/recipient/${chatId}`), expect.any(Object));
		expect(sodium.crypto_scalarmult).toHaveBeenCalled();
		expect(sodium.crypto_kdf_derive_from_key).toHaveBeenCalled();
		expect((keyManager as any).sharedKeyCache[chatId]).toBeDefined();
	});

	it('should return cached shared key if not expired', async () => {
		const cachedKey = new Uint8Array([9, 9, 9]);
		const now = Date.now();

		(keyManager as any).sharedKeyCache[chatId] = { key: cachedKey, timestamp: now };

		const sharedKey = await keyManager.getSharedKey(chatId, userId);

		expect(sharedKey).toEqual(cachedKey);
		expect(fetch).not.toHaveBeenCalled();
	});

	it('should throw an error if recipient public key not found', async () => {
		mockFetchFailure('Public key not found', 404);

		await expect(keyManager.getSharedKey(chatId, userId)).rejects.toThrow('RecipientPublicKeyNotFound');
	});

	it('should clear keys from memory and cache', () => {
		(keyManager as any).userDecryptedPrivateKey = new Uint8Array([1, 2, 3]);
		(keyManager as any).sharedKeyCache = {
			chat1: { key: new Uint8Array([4, 5, 6]), timestamp: Date.now() },
		};

		keyManager.clearKeys();

		expect(sodium.memzero).toHaveBeenCalled();
		expect((keyManager as any).userDecryptedPrivateKey).toBeNull();
		expect(Object.keys((keyManager as any).sharedKeyCache)).toHaveLength(0);
	});
});

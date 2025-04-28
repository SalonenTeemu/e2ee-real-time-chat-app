import { createKeyPair, encryptAndStorePrivateKey, clearKeys } from '../../../src/services/key/keys';
import { saveToDB } from '../../../src/utils/db';
import { keyManager } from '../../../src/services/key/keyManager';

// Mock the libsodium-wrappers library to avoid actual cryptographic operations
jest.mock('libsodium-wrappers', () => ({
	ready: Promise.resolve(),
	randombytes_buf: jest.fn(() => new Uint8Array(24)),
	crypto_secretbox_easy: jest.fn(() => new Uint8Array([1, 2, 3])),
	to_base64: jest.fn(() => 'mockBase64'),
}));

// Mock the KeyManager class
jest.mock('../../../src/services/key/keyManager', () => ({
	keyManager: {
		deriveEncryptionKey: jest.fn(() => Promise.resolve({})),
		getSharedKey: jest.fn(),
		getDecryptedPrivateKey: jest.fn(),
		clearKeys: jest.fn(),
	},
}));

/**
 * Test suite for the keys.ts module including encrypting and storing private keys, creating key pairs, and clearing keys.
 */
describe('keys.ts tests', () => {
	beforeAll(() => {
		const subtleMock = {
			exportKey: jest.fn(() => Promise.resolve(new ArrayBuffer(32))),
		};

		const cryptoMock = {
			subtle: subtleMock,
			getRandomValues: (arr: Uint8Array) => {
				for (let i = 0; i < arr.length; i++) {
					arr[i] = Math.floor(Math.random() * 256);
				}
				return arr;
			},
		};

		Object.defineProperty(global, 'crypto', {
			value: cryptoMock,
		});
	});

	it('should encrypt and store the private key', async () => {
		const privateKey = new Uint8Array([1, 2, 3]);
		const password = 'password123';
		const userId = 'user123';

		await encryptAndStorePrivateKey(privateKey, password, userId);

		expect(saveToDB).toHaveBeenCalledWith(
			`encryptedPrivateKey_${userId}`,
			expect.objectContaining({
				salt: 'mockBase64',
				nonce: 'mockBase64',
				data: 'mockBase64',
			})
		);
	});

	it('should create a key pair and store the private key', async () => {
		const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
		const password = 'pass';
		const userId = 'user1';

		// Mock mnemonicToPrivateKey
		jest.mocked(await import('../../../src/utils/seed')).mnemonicToPrivateKey = jest.fn().mockResolvedValue({
			privateKey: new Uint8Array([1, 2, 3]),
			publicKey: new Uint8Array([4, 5, 6]),
		});

		const publicKey = await createKeyPair(password, userId, mnemonic);

		expect(publicKey).toEqual('mockBase64');
		expect(saveToDB).toHaveBeenCalled();
	});

	it('should throw an error if password is not provided', async () => {
		const privateKey = new Uint8Array([1, 2, 3]);
		const userId = 'user123';
		await expect(encryptAndStorePrivateKey(privateKey, '', userId)).rejects.toThrow('Password is required to encrypt the private key');
	});

	it('should clear keys', () => {
		clearKeys();
		expect(keyManager.clearKeys).toHaveBeenCalled();
	});
});

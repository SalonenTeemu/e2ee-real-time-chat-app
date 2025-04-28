import { encryptMessage, decryptMessage } from '../../src/utils/encryption';

/**
 * Test suite for the message encryption and decryption functions.
 */
describe('encryption.ts tests', () => {
	it('should encrypt and decrypt a message correctly', async () => {
		const sharedKey = new Uint8Array(32).fill(1);
		const message = 'Hello, World!';

		const encryptedMessage = await encryptMessage(message, sharedKey);
		expect(encryptedMessage).toBeDefined();

		const decryptedMessage = await decryptMessage(encryptedMessage, sharedKey);
		expect(decryptedMessage).toEqual(message);
	});

	it('should throw an error if decryption fails', async () => {
		const sharedKey = new Uint8Array(32).fill(1);
		const invalidEncryptedData = 'invalid:encrypted:data';

		await expect(decryptMessage(invalidEncryptedData, sharedKey)).rejects.toThrow('Decryption failed');
	});
});

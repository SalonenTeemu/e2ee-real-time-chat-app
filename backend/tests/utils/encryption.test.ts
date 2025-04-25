import { encryptMessage } from '../../utils/encryption';
import { decryptMessage } from '../../utils/encryption';

/**
 * Test suite for message encryption and decryption functions.
 */
describe('encryption.ts tests', () => {
	it('should encrypt a message', () => {
		const message = 'Hello World!';
		const encryptedMessage = encryptMessage(message);
		expect(encryptedMessage).not.toBe(message);
		expect(typeof encryptedMessage).toBe('string');
		expect(encryptedMessage.split(':').length).toBe(3);
	});

	it('should decrypt a message', () => {
		const message = 'Hello World!';
		const encryptedMessage = encryptMessage(message);
		const decryptedMessage = decryptMessage(encryptedMessage);
		expect(decryptedMessage).toBe(message);
		expect(typeof decryptedMessage).toBe('string');
	});

	it('should throw an error for malformed encrypted message', () => {
		const malformedMessage = 'malformed:message';
		expect(() => decryptMessage(malformedMessage)).toThrow('Malformed encrypted message');
	});
});

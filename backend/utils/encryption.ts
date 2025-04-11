import crypto from 'crypto';
import logger from './logger';

const ALGORITHM = 'aes-256-gcm';

// Key for encrypting and decrypting messages. Please add your own key in the .env file (must be 256 bits (32 characters)). This is just a placeholder key.
const ENCRYPTION_KEY = process.env.DB_ENCRYPTION_KEY || '5537c2abc506de279e641bc797a7e05d1d9eaa3d68bec3e47968f090a25872eb';

const IV_LENGTH = 12; // Recommended for GCM

/**
 * Encrypts a message using AES-256-GCM.
 *
 * @param {string} message The message to encrypt
 * @returns {string} The encrypted message
 * @throws {Error} If encryption fails
 */
export const encryptMessage = (message: string) => {
	try {
		const iv = crypto.randomBytes(IV_LENGTH);
		const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

		let encrypted = cipher.update(message, 'utf8', 'hex');
		encrypted += cipher.final('hex');
		const authTag = cipher.getAuthTag().toString('hex');

		return `${iv.toString('hex')}:${encrypted}:${authTag}`;
	} catch (error: any) {
		logger.error(`Message encryption failed: ${error}`);
		throw new Error(`Encryption failed: ${error.message}`);
	}
};

/**
 * Decrypts a message using AES-256-GCM.
 *
 * @param {string} encryptedMessage The encrypted message to decrypt
 * @returns {string} The decrypted message
 * @throws {Error} If decryption fails
 */
export const decryptMessage = (encryptedMessage: string) => {
	try {
		const [iv, encrypted, authTag] = encryptedMessage.split(':');
		if (!iv || !encrypted || !authTag) {
			throw new Error('Malformed encrypted message');
		}

		const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), Buffer.from(iv, 'hex'));
		decipher.setAuthTag(Buffer.from(authTag, 'hex'));

		let decrypted = decipher.update(encrypted, 'hex', 'utf8');
		decrypted += decipher.final('utf8');

		return decrypted;
	} catch (error: any) {
		logger.error(`Message decryption failed: ${error}`);
		throw new Error(`Decryption failed: ${error.message}`);
	}
};

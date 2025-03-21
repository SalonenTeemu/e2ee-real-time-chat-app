import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.DB_ENCRYPTION_KEY || ''; // Length must be 64

const IV_LENGTH = 12; // Recommended for GCM

/**
 * Encrypts a message using AES-256-GCM.
 *
 * @param message The message to encrypt
 * @returns The encrypted message
 */
export const encryptMessage = (message: string) => {
	const iv = crypto.randomBytes(IV_LENGTH);
	const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

	let encrypted = cipher.update(message, 'utf8', 'hex');
	encrypted += cipher.final('hex');
	const authTag = cipher.getAuthTag().toString('hex');

	return `${iv.toString('hex')}:${encrypted}:${authTag}`;
};

/**
 * Decrypts a message using AES-256-GCM.
 *
 * @param encryptedMessage The encrypted message
 * @returns The decrypted message
 */
export const decryptMessage = (encryptedMessage: string) => {
	const [iv, encrypted, authTag] = encryptedMessage.split(':');

	const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), Buffer.from(iv, 'hex'));

	decipher.setAuthTag(Buffer.from(authTag, 'hex'));

	let decrypted = decipher.update(encrypted, 'hex', 'utf8');
	decrypted += decipher.final('utf8');

	return decrypted;
};

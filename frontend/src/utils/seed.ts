import * as bip39 from 'bip39';
import nacl from 'tweetnacl';
import sodium from 'libsodium-wrappers';
import { logError } from './logger';

/**
 * Generate a random seed phrase using BIP39.
 *
 * @returns {string | null} The generated seed phrase or null if an error occurs
 */
export const generateSeedPhrase = async (): Promise<string | null> => {
	try {
		await sodium.ready;
		return bip39.generateMnemonic(256); // 256-bit entropy (32 bytes) for 24-word mnemonic
	} catch (error: any) {
		logError('Error generating seed phrase:', error);
		return null;
	}
};

/**
 * Convert a mnemonic phrase to a private key using BIP39 and Ed25519.
 * Convert the Ed25519 key pair to X25519 key pair using libsodium.
 *
 * @param {string} mnemonic The mnemonic phrase to convert
 * @param {string} password The password of the user
 * @returns { privateKey: Uint8Array; publicKey: Uint8Array } The generated private and public keys
 */
export const mnemonicToPrivateKey = async (mnemonic: string, password: string): Promise<{ privateKey: Uint8Array; publicKey: Uint8Array }> => {
	await sodium.ready;

	if (!bip39.validateMnemonic(mnemonic)) {
		logError('Invalid mnemonic:', mnemonic);
		throw new Error('Invalid mnemonic');
	}

	// Use the password as the passphrase in mnemonicToSeed
	const seed = await bip39.mnemonicToSeed(mnemonic, password); // 64 bytes
	const seed32 = new Uint8Array(seed).slice(0, 32); // Take first 32 bytes

	// Generate Ed25519 key pair
	const ed25519KeyPair = nacl.sign.keyPair.fromSeed(seed32);

	// Convert Ed25519 key pair to X25519 key pair using libsodium
	const x25519PrivateKey = sodium.crypto_sign_ed25519_sk_to_curve25519(ed25519KeyPair.secretKey);
	const x25519PublicKey = sodium.crypto_sign_ed25519_pk_to_curve25519(ed25519KeyPair.publicKey);

	return {
		privateKey: x25519PrivateKey,
		publicKey: x25519PublicKey,
	};
};

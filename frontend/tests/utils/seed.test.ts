import { generateSeedPhrase, mnemonicToPrivateKey } from '../../src/utils/seed';

/**
 * Test suite for the seed phrase generation and conversion functions.
 */
describe('seed.ts tests', () => {
	it('should generate a valid seed phrase', async () => {
		const seedPhrase = await generateSeedPhrase();
		expect(seedPhrase).not.toBeNull();
		expect(seedPhrase?.split(' ').length).toBe(24);
	});

	it('should convert a mnemonic to a private key', async () => {
		const mnemonic = await generateSeedPhrase();
		expect(mnemonic).not.toBeNull();
		expect(mnemonic?.split(' ').length).toBe(24);

		const password = 'testpassword';
		if (mnemonic) {
			const { privateKey, publicKey } = await mnemonicToPrivateKey(mnemonic, password);
			expect(privateKey).toBeInstanceOf(Uint8Array);
			expect(publicKey).toBeInstanceOf(Uint8Array);
			expect(privateKey.length).toBe(32);
			expect(publicKey.length).toBe(32);
		} else {
			fail('Mnemonic should not be null');
		}
	});

	it('should throw an error for an invalid mnemonic', async () => {
		const invalidMnemonic = 'invalid mnemonic phrase';
		const password = 'testpassword';

		await expect(mnemonicToPrivateKey(invalidMnemonic, password)).rejects.toThrow('Invalid mnemonic');
	});
});

import { validateMessage, validatePassword, validateRegisterAndLogin, validateUserSearchTerm, validateSeedPhrase } from '../../src/utils/validate';
import { generateSeedPhrase } from '../../src/utils/seed';

/**
 * Test suite for the validation functions.
 */
describe('validate.ts tests', () => {
	it('should validate a password', () => {
		const password = 'StrongPassword123!';
		const isValid = validatePassword(password);
		expect(isValid).toBe(true);

		const weakPassword = 'weak123-456789';
		const isWeakValid = validatePassword(weakPassword);
		expect(isWeakValid).toBe(false);

		const longPassword = 'a'.repeat(101);
		const isLongValid = validatePassword(longPassword);
		expect(isLongValid).toBe(false);

		const shortPassword = 'short';
		const isShortValid = validatePassword(shortPassword);
		expect(isShortValid).toBe(false);
	});

	it('should validate a username and password for registration and login', () => {
		const username = 'validUser';
		const password = 'ValidPassword123!';
		const result = validateRegisterAndLogin(username, password);
		expect(result.success).toBe(true);

		const invalidUsername = 'us';
		const invalidPassword = 'weak';
		const invalidResult = validateRegisterAndLogin(invalidUsername, invalidPassword);
		expect(invalidResult.success).toBe(false);
		expect(invalidResult.message).toBe('Username must be between 4 and 50 characters.');
	});

	it('should validate a user search term', () => {
		const searchTerm = 'search';
		const isValid = validateUserSearchTerm(searchTerm);
		expect(isValid).toBe(true);

		const shortSearchTerm = 'a';
		const isShortValid = validateUserSearchTerm(shortSearchTerm);
		expect(isShortValid).toBe(true);

		const longSearchTerm = 'a'.repeat(51);
		const isLongValid = validateUserSearchTerm(longSearchTerm);
		expect(isLongValid).toBe(false);

		const emptySearchTerm = '';
		const isEmptyValid = validateUserSearchTerm(emptySearchTerm);
		expect(isEmptyValid).toBe(false);
	});

	it('should validate a message', () => {
		const message = 'Hello, World!';
		const isValid = validateMessage(message);
		expect(isValid).toBe(true);

		const emptyMessage = '';
		const isEmptyValid = validateMessage(emptyMessage);
		expect(isEmptyValid).toBe(false);

		const longMessage = 'a'.repeat(1001);
		const isLongValid = validateMessage(longMessage);
		expect(isLongValid).toBe(false);
	});

	it('should validate a seed phrase', async () => {
		const validSeedPhrase = await generateSeedPhrase();
		if (validSeedPhrase) {
			const isValid = validateSeedPhrase(validSeedPhrase);
			expect(isValid).toBe(true);
		} else {
			fail('Generated seed phrase should not be null');
		}

		const invalidSeedPhrase = 'invalid seed phrase';
		const isInvalidValid = validateSeedPhrase(invalidSeedPhrase);
		expect(isInvalidValid).toBe(false);

		const emptySeedPhrase = '';
		const isEmptyValid = validateSeedPhrase(emptySeedPhrase);
		expect(isEmptyValid).toBe(false);

		const seedPhraseArray = validSeedPhrase?.split(' ') || [];
		seedPhraseArray[5] = 'toolongword';
		const invalidSeedPhraseArray = seedPhraseArray.join(' ');
		const isInvalidArrayValid = validateSeedPhrase(invalidSeedPhraseArray);
		expect(isInvalidArrayValid).toBe(false);
	});
});

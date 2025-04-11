import { passwordStrength } from 'check-password-strength';

/**
 * Validate a username.
 *
 * @param {string} username The username to validate
 * @returns {boolean} The result of the validation
 */
const validateUsername = (username: string): boolean => {
	return username.length >= 4 && username.length <= 50;
};

/**
 * Validate a password.
 *
 * @param {string} password The password to validate
 * @returns {boolean} The result of the validation
 */
export const validatePassword = (password: string): boolean => {
	const strength = passwordStrength(password).id;
	return strength == 3 && password.length <= 100;
};

/**
 * Validate a username and password for registration and login.
 *
 * @param {string} username The username to validate
 * @param {string} password The password to validate
 * @returns {{ success: boolean; message?: string }} The result of the validation
 */
export const validateRegisterAndLogin = (username: string, password: string): { success: boolean; message?: string } => {
	if (!username || !password) {
		return { success: false, message: 'Username and password are required.' };
	}
	if (!validateUsername(username)) {
		return { success: false, message: 'Username must be between 4 and 50 characters.' };
	}
	if (!validatePassword(password)) {
		return {
			success: false,
			message: 'Password must be between 12 and 100 characters and have lower case, upper case, number, and a special character.',
		};
	}
	return { success: true };
};

/**
 * Validate a user search term.
 *
 * @param {string} searchTerm The search term to validate
 * @returns {boolean} The result of the validation
 */
export const validateUserSearchTerm = (searchTerm: string): boolean => {
	return searchTerm.length >= 1 && searchTerm.length <= 50;
};

/**
 * Validate a message.
 *
 * @param {string} message The message to validate
 * @returns {boolean} The result of the validation
 */
export const validateMessage = (message: string): boolean => {
	return message.length >= 1 && message.length <= 1000;
};

/**
 * Validate a seed phrase (mnemonic).
 *
 * @param {string} mnemonic The seed phrase to validate
 * @returns {boolean} The result of the validation
 */
export const validateSeedPhrase = (mnemonic: string): boolean => {
	const words = mnemonic.split(' ');
	if (words.length !== 24) return false;
	for (const word of words) {
		if (word.length < 3 || word.length > 10) return false;
	}
	return true;
};

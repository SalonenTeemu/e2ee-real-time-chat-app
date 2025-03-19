import { passwordStrength } from 'check-password-strength';

/**
 * Validate a username.
 *
 * @param username The username to validate
 * @returns The result of the validation
 */
const validateUsername = (username: string): boolean => {
	return username.length >= 4 && username.length <= 50;
};

/**
 * Validate a password.
 *
 * @param password The password to validate
 * @returns The result of the validation
 */
const validatePassword = (password: string): boolean => {
	const strength = passwordStrength(password).id;
	return strength == 3 && password.length <= 100;
};

/**
 * Validate a username and password for registration and login.
 *
 * @param username The username to validate
 * @param password The password to validate
 * @returns The result of the validation
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
			message: 'Password must be between 12 and 100 characters and have lower case, upper case, number, and special character.',
		};
	}
	return { success: true };
};

/**
 * Validate a user search term.
 *
 * @param searchTerm The user search term to validate
 * @returns The result of the validation
 */
export const validateUserSearchTerm = (searchTerm: string): boolean => {
	return searchTerm.length >= 1 && searchTerm.length <= 50;
};

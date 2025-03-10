/**
 * Validate a username.
 *
 * @param username The username to validate
 * @returns The result of the validation
 */
function validateUsername(username: string): boolean {
	return username.length >= 4 && username.length <= 50;
}

/**
 * Validate a password.
 *
 * @param password The password to validate
 * @returns The result of the validation
 */
function validatePassword(password: string): boolean {
	return password.length >= 6 && password.length <= 100 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password);
}

/**
 * Validate a username and password for registration and login.
 *
 * @param username The username to validate
 * @param password The password to validate
 * @returns The result of the validation
 */
export function validateRegisterAndLogin(username: string, password: string): { success: boolean; message?: string } {
	if (!username || !password) {
		return { success: false, message: 'Username and password are required.' };
	}
	if (!validateUsername(username)) {
		return { success: false, message: 'Username must be between 4 and 50 characters.' };
	}
	if (!validatePassword(password)) {
		return {
			success: false,
			message: 'Password must be between 6 and 100 characters and contain at least one lowercase letter, one uppercase letter, and one number.',
		};
	}
	return { success: true };
}

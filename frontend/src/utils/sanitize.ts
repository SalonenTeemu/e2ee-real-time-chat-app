import DOMPurify from 'dompurify';

/**
 * Sanitizes a message to prevent XSS attacks.
 *
 * @param {string} message The message to sanitize
 * @returns {string} The sanitized message
 */
export const sanitizeMessage = (message: string): string => {
	// Sanitize the message using DOMPurify
	return DOMPurify.sanitize(message);
};

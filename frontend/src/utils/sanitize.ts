import DOMPurify from 'dompurify';

/**
 * Sanitizes a message to prevent XSS attacks.
 *
 * @param message The message to sanitize
 * @returns The sanitized message
 */
export const sanitizeMessage = (message: string): string => {
	return DOMPurify.sanitize(message);
};

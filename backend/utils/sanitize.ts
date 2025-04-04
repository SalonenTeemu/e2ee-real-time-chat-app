import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

/**
 * Sanitizes a message.
 *
 * @param message The message to sanitize
 * @returns The sanitized message
 */
export const sanitizeMessage = (message: string): string => {
	// Sanitize the message using DOMPurify
	return purify.sanitize(message);
};

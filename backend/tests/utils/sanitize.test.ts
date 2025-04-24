import { sanitizeMessage } from '../../utils/sanitize';

describe('sanitize', () => {
	it('should sanitize a message', () => {
		const message = '<Hello/>Hello';
		const sanitizedMessage = sanitizeMessage(message);
		expect(sanitizedMessage).not.toContain('<Hello/>');
		expect(sanitizedMessage).toBe('Hello');
	});
});

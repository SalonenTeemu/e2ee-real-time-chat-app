import { sanitizeMessage } from '../../utils/sanitize';

/**
 * Test suite for message sanitization function.
 */
describe('sanitize.ts tests', () => {
	it('should sanitize a message containing script tag', () => {
		const message = '<script>alert("XSS")</script>Hello World!';
		const sanitizedMessage = sanitizeMessage(message);
		expect(sanitizedMessage).not.toContain('<script>');
		expect(sanitizedMessage).not.toContain('alert');
		expect(sanitizedMessage).toBe('Hello World!');
	});

	it('should sanitize a message containing img tag with onerror', () => {
		const message = '<img src=x onerror=alert(1)//>';
		const sanitizedMessage = sanitizeMessage(message);
		expect(sanitizedMessage).not.toContain('alert');
		expect(sanitizedMessage).not.toContain('onerror');
		expect(sanitizedMessage).toBe('<img src="x">');
	});

	it('should sanitize a message containing iframe tag', () => {
		const message = '<p>abc<iframe src="http://example.com"></iframe></p>';
		const sanitizedMessage = sanitizeMessage(message);
		expect(sanitizedMessage).not.toContain('<iframe>');
		expect(sanitizedMessage).toBe('<p>abc</p>');
	});

	it('should sanitize a message containing SVG with onload and alert', () => {
		const message = '<svg><g/onload=alert(2)//<p>';
		const sanitizedMessage = sanitizeMessage(message);
		expect(sanitizedMessage).not.toContain('onload');
		expect(sanitizedMessage).not.toContain('alert');
		expect(sanitizedMessage).toBe('<svg><g></g></svg>');
	});
});

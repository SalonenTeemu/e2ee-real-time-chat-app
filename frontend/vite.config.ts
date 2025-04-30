import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import path from 'path';

/**
 * Vite configuration file for the frontend application.
 */
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, path.resolve(__dirname, '..'));

	// Load environment variables from .env file
	const isDev = env.VITE_ENV !== 'production';
	const backendPort = env.VITE_BACKEND_PORT || '5000';
	const frontendPort = env.VITE_FRONTEND_PORT || '5173';

	/**
	 * Content Security Policy (CSP) settings for the client application.
	 */
	const csp = `
    default-src 'self';
    script-src 'self'${isDev ? " 'unsafe-inline' 'unsafe-eval'" : " 'wasm-unsafe-eval'"};
    style-src 'self'${isDev ? " 'unsafe-inline'" : ''};
    img-src 'self' data:;
    font-src 'self';
    connect-src 'self' ws://localhost:${backendPort} ws://backend:${backendPort} http://localhost:${backendPort} http://backend:${backendPort};
    frame-ancestors 'none';
    form-action 'self';
    base-uri 'self';
    object-src 'none';
      `;

	/**
	 * Shared middleware configuration for both dev and preview servers.
	 */
	const configureHeaders = (server: any) => {
		server.middlewares.use((_: any, res: any, next: any) => {
			// Set X-FRAME-OPTIONS to DENY to prevent clickjacking
			res.setHeader('X-Frame-Options', 'DENY');

			// Set X-Content-Type-Options to nosniff to prevent MIME type sniffing
			res.setHeader('X-Content-Type-Options', 'nosniff');

			// Set Content-Security-Policy to prevent XSS attacks
			res.setHeader('Content-Security-Policy', csp.replace(/\s{2,}/g, ' ').trim());

			// Set Permissions-Policy to restrict features
			res.setHeader(
				'Permissions-Policy',
				'accelerometer=(), autoplay=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
			);

			// Set Cross-Origin Resource Policy headers to same origin
			res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

			// Set Cross-Origin Opener Policy and Cross-Origin Embedder Policy headers
			res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
			res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

			// Set Cache-Control, Pragma, and Expires headers to prevent caching
			res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
			res.setHeader('Pragma', 'no-cache');
			res.setHeader('Expires', '0');
			next();
		});
	};

	return {
		plugins: [
			react(),
			tailwindcss(),
			{
				name: 'custom-middleware',
				configureServer: configureHeaders,
				configurePreviewServer: configureHeaders,
			},
		],
		optimizeDeps: {
			esbuildOptions: {
				define: {
					global: 'globalThis',
				},
				plugins: [
					NodeGlobalsPolyfillPlugin({
						buffer: true,
					}),
				],
			},
		},
		resolve: {
			alias: {
				buffer: 'buffer',
			},
		},
		server: {
			port: parseInt(frontendPort),
			host: '0.0.0.0',
		},
		preview: {
			port: parseInt(frontendPort),
			host: '0.0.0.0',
		},
	};
});

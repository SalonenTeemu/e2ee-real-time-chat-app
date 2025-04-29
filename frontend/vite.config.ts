import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';

const backendPort = process.env.VITE_BACKEND_PORT || '5000';
const frontendPort = process.env.VITE_FRONTEND_PORT || '5173';

/**
 * Content Security Policy (CSP) for the application client.
 */
const csp = `default-src 'self';
     script-src 'self' 'unsafe-inline' 'unsafe-eval';
     style-src 'self' 'unsafe-inline';
     img-src 'self' data:;
     font-src 'self';
     connect-src 'self' ws://localhost:${backendPort} ws://backend:${backendPort} http://localhost:${backendPort} http://backend:${backendPort};
     frame-ancestors 'none';
     form-action 'self';
     base-uri 'self';
     object-src 'none';`;

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		{
			name: 'custom-middleware',
			configureServer(server) {
				server.middlewares.use((_, res, next) => {
					// Security headers
					res.setHeader('X-Frame-Options', 'DENY');
					res.setHeader('X-Content-Type-Options', 'nosniff');

					// CSP header
					res.setHeader('Content-Security-Policy', csp.replace(/\s{2,}/g, ' ').trim());

					// Additional headers
					res.setHeader(
						'Permissions-Policy',
						'accelerometer=(), autoplay=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
					);
					res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
					res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
					res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

					// Cache control headers
					res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
					res.setHeader('Pragma', 'no-cache');
					res.setHeader('Expires', '0');

					next();
				});
			},
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
	},
});

import '@testing-library/jest-dom';

import { TextEncoder, TextDecoder } from 'util';

if (typeof global.TextEncoder === 'undefined') {
	(global as any).TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
	(global as any).TextDecoder = TextDecoder;
}

// Mock the useNavigate hook
jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'),
	useNavigate: jest.fn(),
}));

// Mock the .env file to provide default values for environment variables in order for the tests to run without errors
jest.mock('../src/utils/env', () => ({
	env: {
		VITE_ENV: 'development',
		VITE_BACKEND_PORT: '5000',
		VITE_FRONTEND_PORT: '5173',
		INDEXED_DB_NAME: 'chat',
		STORE_NAME: 'keys',
	},
}));

// Mock the IndexedDB functions to avoid actual database operations
jest.mock('../src/utils/db', () => ({
	saveToDB: jest.fn(),
	getFromDB: jest.fn(),
}));

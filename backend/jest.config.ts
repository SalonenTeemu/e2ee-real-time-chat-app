import type { Config } from 'jest';

/**
 * Jest configuration file.
 */
const config: Config = {
	rootDir: './',
	preset: 'ts-jest',
	testEnvironment: 'node',
	transform: {
		'^.+\\.tsx?$': 'ts-jest',
	},
	testMatch: ['<rootDir>/tests/**/*.test.ts'],
	moduleFileExtensions: ['js', 'ts', 'json', 'node'],
	globalSetup: '<rootDir>/tests/jest.global-setup.ts',
	globalTeardown: '<rootDir>/tests/jest.global-teardown.ts',
	maxWorkers: 1, // Run tests serially to avoid database connection issues
	testTimeout: 10000,
};

export default config;

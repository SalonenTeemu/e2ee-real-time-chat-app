import type { Config } from 'jest';

/**
 * * Jest configuration file.
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
};

export default config;

import type { Config } from 'jest';

/**
 * Jest configuration file.
 */
const config: Config = {
	rootDir: './',
	testEnvironment: 'jsdom',
	setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.ts'],
	transform: {
		'^.+\\.tsx?$': 'ts-jest',
	},
	testMatch: ['<rootDir>/tests/**/*.{test.ts,test.tsx}'],
	moduleNameMapper: {
		'\\.(css|less|scss|sass|png|svg)$': '<rootDir>/tests/mocks/fileMock.js',
	},
};

export default config;

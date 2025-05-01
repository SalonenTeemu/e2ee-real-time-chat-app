import db from '../db/knex';

/**
 * Global teardown for Jest tests.
 * Deletes the test database schema after all tests have run.
 */
export default async () => {
	const schema = process.env.DB_SCHEMA || 'chat-app-test';

	try {
		await db.schema.dropSchemaIfExists(schema, true);
		await db.destroy();
		console.log('Test database schema deleted successfully after Jest tests');
		process.exit(0);
	} catch (error: any) {
		console.error('Error with Jest global teardown:', error);
	}
};

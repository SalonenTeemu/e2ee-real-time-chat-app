import db from './knex';

const schemaName = 'chat';
export const userTableName = `${schemaName}.users`;
export const messageTableName = `${schemaName}.messages`;
export const refreshTokenTableName = `${schemaName}.refresh_tokens`;

/**
 * Initialize the database by creating the schema and tables if they don't exist
 */
export const initializeDatabase = async () => {
	try {
		await db.raw('SELECT 1');
		console.log('Connected to the database');
		await db.schema.createSchemaIfNotExists(schemaName);

		await createTables();

		console.log('Tables created');
	} catch (err: unknown) {
		console.error('Error connecting to the database or creating tables:', err);
	}
};

/**
 * Create the tables in the database if they don't exist.
 */
const createTables = async () => {
	if (!(await db.schema.withSchema(schemaName).hasTable('users'))) {
		await db.schema.withSchema(schemaName).createTable('users', (table) => {
			table.uuid('id').defaultTo(db.raw('gen_random_uuid()')).primary();
			table.string('username', 50).unique().notNullable();
			table.string('password', 255).notNullable();
		});
	}

	if (!(await db.schema.withSchema(schemaName).hasTable('messages'))) {
		await db.schema.withSchema(schemaName).createTable('messages', (table) => {
			table.uuid('id').defaultTo(db.raw('gen_random_uuid()')).primary();
			table.uuid('sender_id').references('id').inTable(userTableName).notNullable();
			table.uuid('receiver_id').references('id').inTable(userTableName).notNullable();
			table.text('content').notNullable();
			table.timestamp('created_at').defaultTo(db.fn.now());
		});
	}

	if (!(await db.schema.withSchema(schemaName).hasTable('refresh_tokens'))) {
		await db.schema.withSchema(schemaName).createTable('refresh_tokens', (table) => {
			table.uuid('id').defaultTo(db.raw('gen_random_uuid()')).primary();
			table.uuid('user_id').references('id').inTable(userTableName).notNullable().onDelete('CASCADE');
			table.string('token', 255).notNullable().unique();
			table.timestamp('expires_at').notNullable();
			table.boolean('is_revoked').defaultTo(false);
			table.timestamp('created_at').defaultTo(db.fn.now());
		});
	}
};

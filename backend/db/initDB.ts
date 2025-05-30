import db from './knex';
import logger from '../utils/logger';
import { USER } from '../utils/constants';

// Set schema dynamically based on environment
const schemaName = process.env.DB_SCHEMA || 'chat-app';

// Define the table names
export const userTableName = `${schemaName}.users`;
export const chatTableName = `${schemaName}.chats`;
export const messageTableName = `${schemaName}.messages`;
export const refreshTokenTableName = `${schemaName}.refresh_tokens`;
export const publicKeyTableName = `${schemaName}.public_keys`;

/**
 * Initialize the database by creating the schema and tables if they don't exist
 */
export const initializeDatabase = async () => {
	try {
		await db.raw('SELECT 1');
		logger.info('Database connection successful');
		await db.schema.createSchemaIfNotExists(schemaName);

		await createTables();
		logger.info('Database tables created successfully');
	} catch (error: any) {
		logger.error(`Error initializing database: ${error.message}`);
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
			table.string('role', 20).defaultTo(USER).notNullable();
		});
	}

	if (!(await db.schema.withSchema(schemaName).hasTable('chats'))) {
		await db.schema.withSchema(schemaName).createTable('chats', (table) => {
			table.uuid('id').defaultTo(db.raw('gen_random_uuid()')).primary();
			table.uuid('user1_id').references('id').inTable(userTableName).notNullable();
			table.uuid('user2_id').references('id').inTable(userTableName).notNullable();
			table.timestamp('created_at').defaultTo(db.fn.now());
		});
	}

	if (!(await db.schema.withSchema(schemaName).hasTable('messages'))) {
		await db.schema.withSchema(schemaName).createTable('messages', (table) => {
			table.uuid('id').defaultTo(db.raw('gen_random_uuid()')).primary();
			table.uuid('chat_id').references('id').inTable(chatTableName).notNullable();
			table.uuid('sender_id').references('id').inTable(userTableName).notNullable();
			table.text('content').notNullable().checkLength('<=', 1000);
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

	if (!(await db.schema.withSchema(schemaName).hasTable('public_keys'))) {
		await db.schema.withSchema(schemaName).createTable('public_keys', (table) => {
			table.uuid('id').defaultTo(db.raw('gen_random_uuid()')).primary();
			table.uuid('user_id').references('id').inTable(userTableName).notNullable().onDelete('CASCADE');
			table.string('public_key', 255).notNullable();
			table.timestamp('created_at').defaultTo(db.fn.now());
		});
	}
};

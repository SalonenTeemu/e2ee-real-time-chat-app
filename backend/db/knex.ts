import knex, { Knex } from 'knex';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

const env = process.env;

/**
 * The database connection.
 */
const db: Knex = knex({
	client: 'pg',
	connection: {
		host: env.DB_HOST || 'localhost',
		port: parseInt(env.DB_PORT || '5432'),
		database: env.DB_NAME || 'chat',
		user: env.DB_USER || 'postgres',
		password: env.DB_PASSWORD || 'password',
	},
	pool: { min: 2, max: 10 },
});

export default db;

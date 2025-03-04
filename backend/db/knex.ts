import knex, { Knex } from 'knex';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const env = process.env;

const db: Knex = knex({
	client: 'pg',
	connection: {
		host: env.DB_HOST,
		port: parseInt(env.DB_PORT || '5432'),
		database: env.DB_NAME,
		user: env.DB_USER,
		password: env.DB_PASSWORD,
	},
	pool: { min: 2, max: 10 },
});

export default db;

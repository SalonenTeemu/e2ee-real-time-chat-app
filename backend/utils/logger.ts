import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Set the log directory to the backend root
const parentDirectory = path.join(__dirname, '..');
const logDirectory = path.join(parentDirectory, 'logs');

// Define log format
const logFormat = winston.format.combine(winston.format.timestamp(), winston.format.json());

/**
 * Logger configuration using Winston and DailyRotateFile for log rotation.
 */
const logger = winston.createLogger({
	level: 'info',
	format: logFormat,
	transports: [
		// Error log file rotation
		new DailyRotateFile({
			filename: `${logDirectory}/error-%DATE%.log`,
			datePattern: 'YYYY-MM-DD',
			level: 'error',
			maxSize: '10m', // Max size of each log file
			maxFiles: '14d', // Keep logs for 14 days and delete older ones
			zippedArchive: true,
		}),

		// Combined log file rotation
		new DailyRotateFile({
			filename: `${logDirectory}/combined-%DATE%.log`,
			datePattern: 'YYYY-MM-DD',
			maxSize: '10m',
			maxFiles: '14d',
			zippedArchive: true,
		}),
	],
	exceptionHandlers: [
		// Exception log file rotation
		new DailyRotateFile({
			filename: `${logDirectory}/exceptions-%DATE%.log`,
			datePattern: 'YYYY-MM-DD',
			maxSize: '10m',
			maxFiles: '14d',
			zippedArchive: true,
		}),
	],
});

// Add console transport for development environment
if (process.env.NODE_ENV !== 'production') {
	logger.add(
		new winston.transports.Console({
			format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
		})
	);
}

export default logger;

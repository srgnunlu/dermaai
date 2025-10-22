import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;

  // Add metadata if present
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }

  // Add stack trace for errors
  if (stack) {
    msg += `\n${stack}`;
  }

  return msg;
});

// Determine log level based on environment
const getLogLevel = () => {
  const env = process.env.NODE_ENV || 'development';

  if (env === 'test') {
    return 'error'; // Only log errors in tests
  }

  if (env === 'production') {
    return 'info'; // Info level in production
  }

  return 'debug'; // Debug level in development
};

// Create logger instance
const logger = winston.createLogger({
  level: getLogLevel(),
  format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
  transports: [
    // Console transport
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    }),

    // File transport for errors (production)
    ...(process.env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
        ]
      : []),
  ],
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Create a stream object for Morgan (HTTP request logging)
export const loggerStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export default logger;

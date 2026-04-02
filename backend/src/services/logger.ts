import winston from 'winston';
import { config } from '../config/index.js';

export const logger = winston.createLogger({
  level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.simple()
  ),
  transports: [new winston.transports.Console()],
});

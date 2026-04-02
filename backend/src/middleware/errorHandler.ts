import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger.js';

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error('Unhandled error', { message: error.message, stack: error.stack });
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
};

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found',
  });
};

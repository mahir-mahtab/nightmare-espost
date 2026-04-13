import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientRustPanicError,
} from '@prisma/client/runtime/library';
import { logger } from '../utils/logger.js';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code: string;
  details?: unknown;

  constructor(message: string, statusCode: number, code = 'APP_ERROR', details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const respond = (
    statusCode: number,
    message: string,
    code: string,
    details?: unknown,
  ) => {
    return res.status(statusCode).json({
      success: false,
      message,
      code,
      ...(details ? { details } : {}),
    });
  };

  if (err instanceof AppError) {
    logger.error(`[${err.statusCode}] ${err.code}: ${err.message}`);
    return respond(err.statusCode, err.message, err.code, err.details);
  }

  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      path: issue.path.join('.') || '(root)',
      message: issue.message,
    }));

    logger.error('[400] VALIDATION_ERROR: Request validation failed', details);
    return respond(400, 'Request validation failed. Please check your input fields.', 'VALIDATION_ERROR', details);
  }

  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return respond(409, 'A record with the same unique value already exists.', 'DB_UNIQUE_CONSTRAINT');
    }

    if (err.code === 'P2025') {
      return respond(404, 'The requested record was not found.', 'DB_RECORD_NOT_FOUND');
    }

    logger.error(`[400] DB_REQUEST_ERROR: ${err.message}`);
    return respond(400, 'Database request failed. Please verify your input and try again.', 'DB_REQUEST_ERROR');
  }

  if (err instanceof PrismaClientInitializationError || err instanceof PrismaClientRustPanicError) {
    logger.error('[503] DB_CONNECTION_ERROR', err);
    return respond(503, 'Database is temporarily unavailable. Please try again shortly.', 'DB_CONNECTION_ERROR');
  }

  const rawError = err as NodeJS.ErrnoException;
  if (rawError?.code && ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'].includes(rawError.code)) {
    logger.error('[503] SERVICE_UNAVAILABLE', err);
    return respond(503, 'A required service is currently unavailable. Please try again shortly.', 'SERVICE_UNAVAILABLE');
  }

  // Unexpected errors
  logger.error('Unexpected error:', err);
  return respond(500, 'Unexpected server error. Please try again.', 'INTERNAL_SERVER_ERROR');
};

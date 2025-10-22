import { Response } from 'express';
import logger from './logger';
import { ZodError } from 'zod';

interface ErrorResponse {
  error: string;
  message?: string;
  details?: any;
  timestamp: string;
}

/**
 * Standardized error response format
 */
export function sendErrorResponse(
  res: Response,
  statusCode: number,
  error: string,
  details?: any
): void {
  const response: ErrorResponse = {
    error,
    timestamp: new Date().toISOString(),
  };

  if (details && process.env.NODE_ENV === 'development') {
    response.details = details;
  }

  res.status(statusCode).json(response);
}

/**
 * Handle common errors and send appropriate responses
 */
export function handleError(res: Response, error: unknown, context: string): void {
  // Log the error
  logger.error(`${context}:`, { error });

  // Handle specific error types
  if (error instanceof ZodError) {
    const validationErrors = error.errors.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
    }));

    return sendErrorResponse(res, 400, 'Validation error', {
      validationErrors,
    });
  }

  if (error instanceof Error) {
    // Known error types
    if (error.message.includes('not found')) {
      return sendErrorResponse(res, 404, 'Resource not found');
    }

    if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
      return sendErrorResponse(res, 401, 'Unauthorized');
    }

    if (error.message.includes('forbidden') || error.message.includes('permission')) {
      return sendErrorResponse(res, 403, 'Forbidden');
    }

    // Generic error with message
    return sendErrorResponse(
      res,
      500,
      'Internal server error',
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }

  // Unknown error type
  sendErrorResponse(res, 500, 'Internal server error');
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(fn: Function) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Global error handling middleware
 */
export function errorMiddleware(err: any, req: any, res: Response, next: any) {
  handleError(res, err, 'Unhandled error');
}

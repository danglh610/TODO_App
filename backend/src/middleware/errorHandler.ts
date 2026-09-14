// src/middleware/errorHandler.ts
// Error handling middleware for Express

import type { Request, Response } from 'express';
import { AppError } from './errors';

/**
 * Not Found (404) handler
 * Called when no route matches the request
 */
export function notFoundHandler(req: Request, res: Response): void {
  console.log(`[404] ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
}

/**
 * Global error handler
 * Catches all errors and returns appropriate response
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: unknown
): void {
  // Database errors
  if ('code' in err) {
    console.error(`[DB Error] ${err.message}`);
    res.status(500).json({
      success: false,
      message: 'Database error occurred'
    });
    return;
  }

  // App errors (custom)
  if (err instanceof AppError) {
    console.error(`[Error ${err.statusCode}] ${err.message}`);
    res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
    return;
  }

  // Unknown errors
  console.error(`[Error] ${err.name}: ${err.message}`);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
}

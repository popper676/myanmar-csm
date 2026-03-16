import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  if (config.nodeEnv !== 'production') {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.code && { code: err.code }),
    });
    return;
  }

  res.status(500).json({ error: 'Internal server error' });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Not found' });
}

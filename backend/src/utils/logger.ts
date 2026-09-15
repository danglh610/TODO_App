// src/utils/logger.ts
// Structured logging utility for observability

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL as LogLevel] ?? LOG_LEVELS.INFO;

/**
 * Format log entry as structured JSON
 */
function formatLog(entry: LogEntry): string {
  const base = `[${entry.timestamp}] [${entry.level}] [${entry.category}] ${entry.message}`;
  return entry.data ? `${base} ${JSON.stringify(entry.data)}` : base;
}

/**
 * Core logging function
 */
function log(level: LogLevel, category: string, message: string, data?: unknown): void {
  if (LOG_LEVELS[level] < currentLevel) return;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    data,
  };

  const formatted = formatLog(entry);

  switch (level) {
    case 'ERROR':
      console.error(formatted);
      break;
    case 'WARN':
      console.warn(formatted);
      break;
    case 'DEBUG':
      if (process.env.NODE_ENV === 'development') {
        console.debug(formatted);
      }
      break;
    default:
      console.log(formatted);
  }
}

// Public API
export const logger = {
  info: (category: string, message: string, data?: unknown) => log('INFO', category, message, data),
  warn: (category: string, message: string, data?: unknown) => log('WARN', category, message, data),
  error: (category: string, message: string, data?: unknown) => log('ERROR', category, message, data),
  debug: (category: string, message: string, data?: unknown) => log('DEBUG', category, message, data),
};

// Request logging middleware
import type { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP', `${req.method} ${req.path} ${res.statusCode} - ${duration}ms`, {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      ip: req.ip,
    });
  });

  next();
}

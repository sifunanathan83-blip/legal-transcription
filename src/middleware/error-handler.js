import logger from '../config/logger.js';
import { RESPONSE_CODES } from '../utils/constants.js';

export default function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || RESPONSE_CODES.SERVER_ERROR;
  const message = err.message || 'An unexpected error occurred';

  logger.error('Request error:', {
    status,
    message,
    path: req.path,
    method: req.method,
    stack: err.stack,
  });

  res.status(status).json({
    error: {
      status,
      message,
      timestamp: new Date().toISOString(),
    },
  });
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.status = RESPONSE_CODES.BAD_REQUEST;
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
    this.status = RESPONSE_CODES.NOT_FOUND;
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
    this.status = RESPONSE_CODES.UNAUTHORIZED;
  }
}

export class ConflictError extends Error {
  constructor(message = 'Conflict') {
    super(message);
    this.name = 'ConflictError';
    this.status = RESPONSE_CODES.CONFLICT;
  }
}

export class InternalServerError extends Error {
  constructor(message = 'Internal server error') {
    super(message);
    this.name = 'InternalServerError';
    this.status = RESPONSE_CODES.SERVER_ERROR;
  }
}
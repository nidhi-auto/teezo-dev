import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { sendError } from '../utils/response.js';

export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.publicMessage);
  }
  if (err.statusCode && err.publicMessage) {
    return sendError(res, err.statusCode, err.publicMessage);
  }
  logger.error(err);
  return sendError(res, 500, 'Something went wrong. Try again later.');
}
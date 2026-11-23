export class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.publicMessage = message;
    this.name = 'AppError';
  }
}

export function notFound(message = 'Resource not found.') {
  return new AppError(404, message);
}

export function forbidden(message = 'You do not have permission to do that.') {
  return new AppError(403, message);
}

export function unauthorized(message = 'Sign in required.') {
  return new AppError(401, message);
}

export function badRequest(message) {
  return new AppError(400, message);
}

export function serviceUnavailable(message = 'Sign-in is not set up yet.') {
  return new AppError(503, message);
}

export function conflict(message) {
  return new AppError(409, message);
}
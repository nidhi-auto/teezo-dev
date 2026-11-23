import pg from 'pg';
import { config } from './config.js';

const pool = config.databaseUrl
  ? new pg.Pool({ connectionString: config.databaseUrl })
  : null;

export function getPool() {
  if (!pool) {
    const err = new Error('Database is not configured');
    err.statusCode = 503;
    err.publicMessage = 'Service is temporarily unavailable.';
    throw err;
  }
  return pool;
}

export async function query(text, params) {
  return getPool().query(text, params);
}
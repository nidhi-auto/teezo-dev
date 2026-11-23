import { verifyAccessToken } from '../utils/cognitoAuth.js';
import { query } from '../utils/db.js';
import { unauthorized } from '../utils/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) {
    throw unauthorized();
  }
  const payload = await verifyAccessToken(match[1]);
  const cognitoSub = payload.sub;
  if (!cognitoSub) {
    throw unauthorized();
  }
  const { rows } = await query(
    'SELECT * FROM users WHERE cognito_sub = $1 AND active = true',
    [cognitoSub],
  );
  let user = rows[0];
  if (!user && payload.username) {
    const byEmail = await query('SELECT * FROM users WHERE email = $1', [
      String(payload.username).toLowerCase(),
    ]);
    user = byEmail.rows[0];
    if (user && !user.cognito_sub) {
      await query('UPDATE users SET cognito_sub = $1 WHERE id = $2', [cognitoSub, user.id]);
      user.cognito_sub = cognitoSub;
    }
  }
  if (!user) {
    throw unauthorized();
  }
  req.auth = { cognitoSub, user };
  next();
});
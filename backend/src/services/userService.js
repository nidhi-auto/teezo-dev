import { query } from '../utils/db.js';
import { mapUser } from '../utils/mappers.js';
import { notFound } from '../utils/errors.js';

export async function countUsers() {
  const { rows } = await query('SELECT COUNT(*)::int AS c FROM users');
  return rows[0].c;
}

export async function findUserByEmail(email) {
  const { rows } = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
  return rows[0] || null;
}

export async function findUserById(id) {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] || null;
}

export async function getUserByIdOrThrow(id) {
  const user = await findUserById(id);
  if (!user) {
    throw notFound('User not found.');
  }
  return user;
}

export async function createUser({ name, email, role, cognitoSub }) {
  const { rows } = await query(
    `INSERT INTO users (name, email, role, cognito_sub)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name, email.toLowerCase(), role, cognitoSub || null],
  );
  await query(
    `INSERT INTO user_settings (user_id) VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING`,
    [rows[0].id],
  );
  return rows[0];
}

export async function updateUserProfile(id, { name, handicap, clubId }) {
  const fields = [];
  const values = [];
  let i = 1;
  if (name !== undefined) {
    fields.push(`name = $${i++}`);
    values.push(name);
  }
  if (handicap !== undefined) {
    fields.push(`handicap = $${i++}`);
    values.push(handicap);
  }
  if (clubId !== undefined) {
    fields.push(`club_id = $${i++}`);
    values.push(clubId);
  }
  if (fields.length === 0) {
    return getUserByIdOrThrow(id);
  }
  values.push(id);
  const { rows } = await query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
    values,
  );
  if (!rows[0]) {
    throw notFound('User not found.');
  }
  return rows[0];
}

export async function syncCognitoSub(userId, cognitoSub) {
  await query('UPDATE users SET cognito_sub = $1 WHERE id = $2', [cognitoSub, userId]);
}

export async function deactivateUser(id) {
  const { rows } = await query(
    'UPDATE users SET active = false WHERE id = $1 RETURNING *',
    [id],
  );
  if (!rows[0]) {
    throw notFound('User not found.');
  }
  return rows[0];
}

export function toPublicUser(row) {
  return mapUser(row);
}

export async function listClubAdmins() {
  const { rows } = await query(
    `SELECT * FROM users WHERE role = 'club_admin' ORDER BY created_at DESC`,
  );
  return rows.map(mapUser);
}

export async function listPlayers(clubId) {
  let sql = `SELECT u.* FROM users u WHERE u.role = 'player'`;
  const params = [];
  if (clubId) {
    sql += ` AND (
      u.club_id = $1
      OR EXISTS (
        SELECT 1 FROM club_memberships cm
        WHERE cm.user_id = u.id AND cm.club_id = $1 AND cm.active = true
      )
    )`;
    params.push(clubId);
  }
  sql += ' ORDER BY u.name';
  const { rows } = await query(sql, params);
  return rows.map(mapUser);
}
import { query } from '../utils/db.js';

export async function ensureMembership(clubId, userId) {
  const existing = await query(
    `SELECT * FROM club_memberships WHERE club_id = $1 AND user_id = $2`,
    [clubId, userId],
  );
  if (existing.rows[0]) {
    if (!existing.rows[0].active) {
      await query(
        `UPDATE club_memberships SET active = true, joined_at = now()
         WHERE id = $1`,
        [existing.rows[0].id],
      );
    }
    return existing.rows[0];
  }
  const { rows } = await query(
    `INSERT INTO club_memberships (club_id, user_id, active)
     VALUES ($1, $2, true)
     RETURNING *`,
    [clubId, userId],
  );
  await query('UPDATE users SET club_id = $1 WHERE id = $2', [clubId, userId]);
  return rows[0];
}

export async function deactivateMembership(clubId, userId) {
  await query(
    `UPDATE club_memberships SET active = false
     WHERE club_id = $1 AND user_id = $2`,
    [clubId, userId],
  );
  await query(
    `UPDATE users SET club_id = NULL WHERE id = $1 AND club_id = $2`,
    [userId, clubId],
  );
}
export async function listMembershipsForActor(user) {
  if (user.role === 'super_admin') {
    const { rows } = await query(
      `SELECT * FROM club_memberships ORDER BY joined_at DESC`,
    );
    return rows;
  }
  if (user.role === 'club_admin' && user.club_id) {
    const { rows } = await query(
      `SELECT * FROM club_memberships WHERE club_id = $1 ORDER BY joined_at DESC`,
      [user.club_id],
    );
    return rows;
  }
  const { rows } = await query(
    `SELECT * FROM club_memberships WHERE user_id = $1 ORDER BY joined_at DESC`,
    [user.id],
  );
  return rows;
}

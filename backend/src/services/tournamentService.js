import { query } from '../utils/db.js';
import { mapTournament } from '../utils/mappers.js';
import { notFound, badRequest, forbidden } from '../utils/errors.js';

export async function listTournaments(clubId) {
  let sql = 'SELECT * FROM tournaments';
  const params = [];
  if (clubId) {
    sql += ' WHERE club_id = $1';
    params.push(clubId);
  }
  sql += ' ORDER BY start_date DESC';
  const { rows } = await query(sql, params);
  return rows.map(mapTournament);
}

export async function getTournamentOrThrow(id) {
  const { rows } = await query('SELECT * FROM tournaments WHERE id = $1', [id]);
  if (!rows[0]) {
    throw notFound('Tournament not found.');
  }
  return rows[0];
}

export async function createTournament(data, createdByUserId) {
  const { rows } = await query(
    `INSERT INTO tournaments (
      club_id, name, description, start_date, end_date, entry_limit,
      scoring_format, status, created_by_user_id
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,'draft',$8)
    RETURNING *`,
    [
      data.clubId,
      data.name,
      data.description || '',
      data.startDate,
      data.endDate,
      data.entryLimit ?? 0,
      data.scoringFormat || 'stroke',
      createdByUserId,
    ],
  );
  return rows[0];
}

export async function updateTournament(id, data) {
  const current = await getTournamentOrThrow(id);
  const fields = [];
  const values = [];
  let i = 1;
  const map = {
    name: 'name',
    description: 'description',
    startDate: 'start_date',
    endDate: 'end_date',
    entryLimit: 'entry_limit',
    scoringFormat: 'scoring_format',
  };
  for (const [key, col] of Object.entries(map)) {
    if (data[key] !== undefined) {
      fields.push(`${col} = $${i++}`);
      values.push(data[key]);
    }
  }
  if (fields.length === 0) {
    return current;
  }
  fields.push(`updated_at = now()`);
  values.push(id);
  const { rows } = await query(
    `UPDATE tournaments SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
    values,
  );
  return rows[0];
}

export async function publishTournament(id) {
  const t = await getTournamentOrThrow(id);
  if (t.status !== 'draft') {
    throw badRequest('Only draft tournaments can be published.');
  }
  const { rows } = await query(
    `UPDATE tournaments SET status = 'live', updated_at = now()
     WHERE id = $1 RETURNING *`,
    [id],
  );
  return rows[0];
}

export async function closeTournament(id) {
  const { rows } = await query(
    `UPDATE tournaments SET status = 'closed', updated_at = now()
     WHERE id = $1 RETURNING *`,
    [id],
  );
  if (!rows[0]) {
    throw notFound('Tournament not found.');
  }
  return rows[0];
}

export async function registerForTournament(tournamentId, userId) {
  const t = await getTournamentOrThrow(tournamentId);
  if (t.status !== 'live') {
    throw badRequest('Registration is only open for live tournaments.');
  }
  if (t.entry_limit > 0) {
    const { rows: countRows } = await query(
      'SELECT COUNT(*)::int AS c FROM tournament_registrations WHERE tournament_id = $1',
      [tournamentId],
    );
    if (countRows[0].c >= t.entry_limit) {
      throw badRequest('This tournament is full.');
    }
  }
  try {
    const { rows } = await query(
      `INSERT INTO tournament_registrations (tournament_id, user_id)
       VALUES ($1, $2)
       RETURNING *`,
      [tournamentId, userId],
    );
    return {
      id: rows[0].id,
      tournamentId: rows[0].tournament_id,
      userId: rows[0].user_id,
      registeredAt: rows[0].registered_at.toISOString(),
    };
  } catch (err) {
    if (err.code === '23505') {
      throw badRequest('You are already registered for this tournament.');
    }
    throw err;
  }
}

export function assertClubAccess(user, clubId) {
  if (user.role === 'super_admin') {
    return;
  }
  if (user.role === 'club_admin' && user.club_id === clubId) {
    return;
  }
  if (user.role === 'player' && user.club_id === clubId) {
    return;
  }
  throw forbidden();
}
export async function listRegistrationsForActor(user) {
  if (user.role === 'super_admin') {
    const { rows } = await query(
      `SELECT * FROM tournament_registrations ORDER BY registered_at DESC`,
    );
    return rows;
  }
  if (user.role === 'club_admin' && user.club_id) {
    const { rows } = await query(
      `SELECT tr.* FROM tournament_registrations tr
       JOIN tournaments t ON t.id = tr.tournament_id
       WHERE t.club_id = $1
       ORDER BY tr.registered_at DESC`,
      [user.club_id],
    );
    return rows;
  }
  const { rows } = await query(
    `SELECT * FROM tournament_registrations WHERE user_id = $1 ORDER BY registered_at DESC`,
    [user.id],
  );
  return rows;
}

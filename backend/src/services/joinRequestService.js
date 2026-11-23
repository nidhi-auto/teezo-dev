import { query } from '../utils/db.js';
import { mapJoinRequest } from '../utils/mappers.js';
import { notFound, badRequest, forbidden } from '../utils/errors.js';
import * as membershipService from './membershipService.js';

export async function listJoinRequests(user) {
  let sql = 'SELECT * FROM join_requests';
  const params = [];
  if (user.role === 'super_admin') {
    sql += ' ORDER BY created_at DESC';
  } else if (user.role === 'club_admin' && user.club_id) {
    sql += ' WHERE club_id = $1 ORDER BY created_at DESC';
    params.push(user.club_id);
  } else if (user.role === 'player') {
    sql += ' WHERE player_user_id = $1 ORDER BY created_at DESC';
    params.push(user.id);
  } else {
    throw forbidden();
  }
  const { rows } = await query(sql, params);
  return rows.map(mapJoinRequest);
}

export async function createJoinRequest({ clubId, message }, playerUserId) {
  const { rows: existing } = await query(
    `SELECT id FROM join_requests
     WHERE club_id = $1 AND player_user_id = $2 AND status = 'pending'`,
    [clubId, playerUserId],
  );
  if (existing[0]) {
    throw badRequest('You already have a pending request for this club.');
  }
  const { rows } = await query(
    `INSERT INTO join_requests (club_id, player_user_id, message, status)
     VALUES ($1, $2, $3, 'pending')
     RETURNING *`,
    [clubId, playerUserId, message || ''],
  );
  return rows[0];
}

async function getJoinRequestOrThrow(id) {
  const { rows } = await query('SELECT * FROM join_requests WHERE id = $1', [id]);
  if (!rows[0]) {
    throw notFound('Join request not found.');
  }
  return rows[0];
}

async function reviewRequest(id, status, reviewerId) {
  const jr = await getJoinRequestOrThrow(id);
  if (jr.status !== 'pending') {
    throw badRequest('This request has already been reviewed.');
  }
  const { rows } = await query(
    `UPDATE join_requests
     SET status = $1, reviewed_at = now(), reviewed_by_user_id = $2
     WHERE id = $3
     RETURNING *`,
    [status, reviewerId, id],
  );
  if (status === 'approved') {
    await membershipService.ensureMembership(jr.club_id, jr.player_user_id);
  }
  return rows[0];
}

export async function approveJoinRequest(id, reviewer) {
  if (reviewer.role === 'club_admin' && reviewer.club_id) {
    const jr = await getJoinRequestOrThrow(id);
    if (jr.club_id !== reviewer.club_id) {
      throw forbidden();
    }
  } else if (reviewer.role !== 'super_admin') {
    throw forbidden();
  }
  return reviewRequest(id, 'approved', reviewer.id);
}

export async function rejectJoinRequest(id, reviewer) {
  if (reviewer.role === 'club_admin' && reviewer.club_id) {
    const jr = await getJoinRequestOrThrow(id);
    if (jr.club_id !== reviewer.club_id) {
      throw forbidden();
    }
  } else if (reviewer.role !== 'super_admin') {
    throw forbidden();
  }
  return reviewRequest(id, 'rejected', reviewer.id);
}
import { query } from '../utils/db.js';
import { mapInvitation } from '../utils/mappers.js';
import { notFound, badRequest, forbidden } from '../utils/errors.js';
import * as membershipService from './membershipService.js';

const INVITE_DAYS = 14;

export async function listInvitations(user) {
  let sql = 'SELECT * FROM invitations';
  const params = [];
  if (user.role === 'super_admin') {
    sql += ' ORDER BY created_at DESC';
  } else if (user.role === 'club_admin' && user.club_id) {
    sql += ' WHERE club_id = $1 ORDER BY created_at DESC';
    params.push(user.club_id);
  } else if (user.role === 'player') {
    sql += ' WHERE LOWER(email) = LOWER($1) ORDER BY created_at DESC';
    params.push(user.email);
  } else {
    throw forbidden();
  }
  const { rows } = await query(sql, params);
  return rows.map(mapInvitation);
}

export async function createInvitation({ clubId, email }, invitedByUserId) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_DAYS);
  const { rows } = await query(
    `INSERT INTO invitations (club_id, email, invited_by_user_id, status, expires_at)
     VALUES ($1, LOWER($2), $3, 'pending', $4)
     RETURNING *`,
    [clubId, email, invitedByUserId, expiresAt],
  );
  return rows[0];
}

async function getInvitationOrThrow(id) {
  const { rows } = await query('SELECT * FROM invitations WHERE id = $1', [id]);
  if (!rows[0]) {
    throw notFound('Invitation not found.');
  }
  return rows[0];
}

function assertInviteOpen(inv) {
  if (inv.status !== 'pending') {
    throw badRequest('This invitation is no longer available.');
  }
  if (new Date(inv.expires_at) < new Date()) {
    throw badRequest('This invitation has expired.');
  }
}

export async function acceptInvitation(id, user) {
  const inv = await getInvitationOrThrow(id);
  if (inv.email.toLowerCase() !== user.email.toLowerCase()) {
    throw forbidden();
  }
  assertInviteOpen(inv);
  const { rows } = await query(
    `UPDATE invitations SET status = 'accepted' WHERE id = $1 RETURNING *`,
    [id],
  );
  await membershipService.ensureMembership(inv.club_id, user.id);
  return rows[0];
}

export async function declineInvitation(id, user) {
  const inv = await getInvitationOrThrow(id);
  if (inv.email.toLowerCase() !== user.email.toLowerCase()) {
    throw forbidden();
  }
  assertInviteOpen(inv);
  const { rows } = await query(
    `UPDATE invitations SET status = 'declined' WHERE id = $1 RETURNING *`,
    [id],
  );
  return rows[0];
}
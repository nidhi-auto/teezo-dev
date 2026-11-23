import { randomBytes } from 'node:crypto';
import { query } from '../utils/db.js';
import { conflict } from '../utils/errors.js';
import { mapClub } from '../utils/mappers.js';
import { notFound } from '../utils/errors.js';
import * as userService from './userService.js';
import { cognitoSignUp } from '../utils/cognitoAuth.js';
import { isCognitoConfigured } from '../utils/config.js';
import { serviceUnavailable } from '../utils/errors.js';
import * as membershipService from './membershipService.js';

export async function listClubs() {
  const { rows } = await query('SELECT * FROM clubs ORDER BY name');
  return rows.map(mapClub);
}

export async function getClubOrThrow(id) {
  const { rows } = await query('SELECT * FROM clubs WHERE id = $1', [id]);
  if (!rows[0]) {
    throw notFound('Club not found.');
  }
  return rows[0];
}

export async function createClub(data) {
  const { rows } = await query(
    `INSERT INTO clubs (name, city, state, holes, description, admin_user_id, active)
     VALUES ($1, $2, $3, $4, $5, $6, true)
     RETURNING *`,
    [
      data.name,
      data.city || '',
      data.state || '',
      data.holes ?? 18,
      data.description || '',
      data.adminUserId || null,
    ],
  );
  return rows[0];
}

export async function createClubAdmin({ name, email, password, clubId }) {
  if (!isCognitoConfigured()) {
    throw serviceUnavailable();
  }
  const existing = await userService.findUserByEmail(email);
  if (existing) {
    throw conflict('Email already in use.');
  }
  const cognitoSub = await cognitoSignUp(email, password, name);
  const user = await userService.createUser({
    name,
    email,
    role: 'club_admin',
    cognitoSub,
  });
  if (clubId) {
    await query('UPDATE users SET club_id = $1 WHERE id = $2', [clubId, user.id]);
    await query('UPDATE clubs SET admin_user_id = $1 WHERE id = $2', [user.id, clubId]);
    await membershipService.ensureMembership(clubId, user.id);
  }
  return user;
}

export async function updateClubAdmin(id, { name, clubId, active }) {
  const user = await userService.getUserByIdOrThrow(id);
  if (user.role !== 'club_admin') {
    throw notFound('Club admin not found.');
  }
  let updated = user;
  if (name !== undefined) {
    updated = await userService.updateUserProfile(id, { name });
  }
  if (clubId !== undefined) {
    updated = await userService.updateUserProfile(id, { clubId });
    await query('UPDATE clubs SET admin_user_id = $1 WHERE id = $2', [id, clubId]);
    await membershipService.ensureMembership(clubId, id);
  }
  if (active === false) {
    updated = await userService.deactivateUser(id);
  }
  return updated;
}

export async function createPlayerInClub(clubId, { name, email, password, handicap }) {
  await getClubOrThrow(clubId);
  if (!isCognitoConfigured()) {
    throw serviceUnavailable();
  }
  let user = await userService.findUserByEmail(email);
  if (!user) {
    const cognitoSub = await cognitoSignUp(
      email,
      password || `${randomBytes(16).toString('base64url')}Aa1!`,
      name,
    );
    user = await userService.createUser({
      name,
      email,
      role: 'player',
      cognitoSub,
    });
  }
  if (handicap !== undefined) {
    user = await userService.updateUserProfile(user.id, { handicap, clubId });
  } else {
    user = await userService.updateUserProfile(user.id, { clubId });
  }
  await membershipService.ensureMembership(clubId, user.id);
  return user;
}
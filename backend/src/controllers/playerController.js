import { z } from 'zod';
import * as userService from '../services/userService.js';
import * as clubService from '../services/clubService.js';
import * as membershipService from '../services/membershipService.js';
import { mapUser } from '../utils/mappers.js';
import { sendSuccess } from '../utils/response.js';
import { parseBody, emailSchema } from '../utils/validate.js';
import { forbidden as forbiddenErr } from '../utils/errors.js';

const createPlayerSchema = z.object({
  name: z.string().min(1),
  email: emailSchema,
  password: z.string().min(8).optional(),
  handicap: z.number().optional(),
});

const patchPlayerSchema = z.object({
  name: z.string().min(1).optional(),
  handicap: z.number().nullable().optional(),
  active: z.boolean().optional(),
});

export async function list(req, res) {
  const clubId = req.query.clubId;
  const players = await userService.listPlayers(clubId || undefined);
  sendSuccess(res, { players });
}

export async function create(req, res) {
  const clubId = req.params.id;
  if (req.auth.user.role === 'player') {
    throw forbiddenErr();
  }
  if (req.auth.user.role === 'club_admin' && req.auth.user.club_id !== clubId) {
    throw forbiddenErr();
  }
  const body = parseBody(createPlayerSchema, req.body);
  const user = await clubService.createPlayerInClub(clubId, body);
  sendSuccess(res, { player: mapUser(user) }, 201);
}

export async function patch(req, res) {
  const body = parseBody(patchPlayerSchema, req.body);
  const playerId = req.params.id;
  const player = await userService.getUserByIdOrThrow(playerId);
  if (player.role !== 'player') {
    throw forbiddenErr();
  }
  if (
    req.auth.user.role === 'club_admin' &&
    req.auth.user.club_id !== player.club_id
  ) {
    throw forbiddenErr();
  }
  let updated = player;
  if (body.name !== undefined || body.handicap !== undefined) {
    updated = await userService.updateUserProfile(playerId, {
      name: body.name,
      handicap: body.handicap,
    });
  }
  if (body.active === false) {
    updated = await userService.deactivateUser(playerId);
  }
  sendSuccess(res, { player: mapUser(updated) });
}

export async function removeFromClub(req, res) {
  const clubId = req.params.id;
  const userId = req.params.userId;
  if (req.auth.user.role === 'club_admin' && req.auth.user.club_id !== clubId) {
    throw forbiddenErr();
  }
  await membershipService.deactivateMembership(clubId, userId);
  sendSuccess(res, { ok: true });
}
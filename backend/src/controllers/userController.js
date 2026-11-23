import { z } from 'zod';
import * as userService from '../services/userService.js';
import * as settingsService from '../services/settingsService.js';
import { mapUser } from '../utils/mappers.js';
import { sendSuccess } from '../utils/response.js';
import { parseBody } from '../utils/validate.js';
import { forbidden } from '../utils/errors.js';

const patchUserSchema = z.object({
  name: z.string().min(1).optional(),
});

const settingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  tournamentAlerts: z.boolean().optional(),
});

function canEditProfile(actor, targetId) {
  if (actor.id === targetId) {
    return true;
  }
  if (actor.role === 'super_admin') {
    return true;
  }
  if (actor.role === 'club_admin') {
    return true;
  }
  return false;
}

export async function patchUser(req, res) {
  const targetId = req.params.id;
  if (!canEditProfile(req.auth.user, targetId)) {
    throw forbidden();
  }
  const body = parseBody(patchUserSchema, req.body);
  const user = await userService.updateUserProfile(targetId, { name: body.name });
  sendSuccess(res, { user: mapUser(user) });
}

export async function getSettings(req, res) {
  const targetId = req.params.id;
  if (req.auth.user.id !== targetId && req.auth.user.role === 'player') {
    throw forbidden();
  }
  const settings = await settingsService.getSettings(targetId);
  sendSuccess(res, { settings });
}

export async function putSettings(req, res) {
  const targetId = req.params.id;
  if (req.auth.user.id !== targetId) {
    throw forbidden();
  }
  const body = parseBody(settingsSchema, req.body);
  const settings = await settingsService.upsertSettings(targetId, body);
  sendSuccess(res, { settings });
}
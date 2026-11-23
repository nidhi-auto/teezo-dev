import { z } from 'zod';
import * as userService from '../services/userService.js';
import * as clubService from '../services/clubService.js';
import { mapUser } from '../utils/mappers.js';
import { sendSuccess } from '../utils/response.js';
import { parseBody, emailSchema } from '../utils/validate.js';

const createSchema = z.object({
  name: z.string().min(1),
  email: emailSchema,
  password: z.string().min(8),
  clubId: z.string().uuid().optional(),
});

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  clubId: z.string().uuid().optional(),
  active: z.boolean().optional(),
});

export async function list(_req, res) {
  const admins = await userService.listClubAdmins();
  sendSuccess(res, { clubAdmins: admins });
}

export async function create(req, res) {
  const body = parseBody(createSchema, req.body);
  const user = await clubService.createClubAdmin(body);
  sendSuccess(res, { clubAdmin: mapUser(user) }, 201);
}

export async function patch(req, res) {
  const body = parseBody(patchSchema, req.body);
  const user = await clubService.updateClubAdmin(req.params.id, body);
  sendSuccess(res, { clubAdmin: mapUser(user) });
}

export async function deactivate(req, res) {
  const user = await clubService.updateClubAdmin(req.params.id, { active: false });
  sendSuccess(res, { clubAdmin: mapUser(user) });
}
import { z } from 'zod';
import * as clubService from '../services/clubService.js';
import { mapClub } from '../utils/mappers.js';
import { sendSuccess } from '../utils/response.js';
import { parseBody } from '../utils/validate.js';

const createClubSchema = z.object({
  name: z.string().min(1),
  city: z.string().optional(),
  state: z.string().optional(),
  holes: z.coerce.number().int().min(1).max(36).optional(),
  description: z.string().optional(),
  adminUserId: z.string().uuid().optional(),
});

export async function list(_req, res) {
  const clubs = await clubService.listClubs();
  sendSuccess(res, { clubs });
}

export async function create(req, res) {
  const body = parseBody(createClubSchema, req.body);
  const club = await clubService.createClub({
    name: body.name,
    city: body.city,
    state: body.state,
    holes: body.holes,
    description: body.description,
    adminUserId: body.adminUserId,
  });
  sendSuccess(res, { club: mapClub(club) }, 201);
}
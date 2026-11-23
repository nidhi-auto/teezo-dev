import { z } from 'zod';
import * as invitationService from '../services/invitationService.js';
import { mapInvitation } from '../utils/mappers.js';
import { sendSuccess } from '../utils/response.js';
import { parseBody, emailSchema } from '../utils/validate.js';
import { forbidden } from '../utils/errors.js';

const createSchema = z.object({
  clubId: z.string().uuid(),
  email: emailSchema,
});

export async function list(req, res) {
  const invites = await invitationService.listInvitations(req.auth.user);
  sendSuccess(res, { invitations: invites });
}

export async function create(req, res) {
  const body = parseBody(createSchema, req.body);
  if (
    req.auth.user.role === 'club_admin' &&
    req.auth.user.club_id !== body.clubId
  ) {
    throw forbidden();
  }
  if (req.auth.user.role !== 'super_admin' && req.auth.user.role !== 'club_admin') {
    throw forbidden();
  }
  const row = await invitationService.createInvitation(body, req.auth.user.id);
  sendSuccess(res, { invitation: mapInvitation(row) }, 201);
}

export async function accept(req, res) {
  const row = await invitationService.acceptInvitation(req.params.id, req.auth.user);
  sendSuccess(res, { invitation: mapInvitation(row) });
}

export async function decline(req, res) {
  const row = await invitationService.declineInvitation(req.params.id, req.auth.user);
  sendSuccess(res, { invitation: mapInvitation(row) });
}
import { z } from 'zod';
import * as joinRequestService from '../services/joinRequestService.js';
import { mapJoinRequest } from '../utils/mappers.js';
import { sendSuccess } from '../utils/response.js';
import { parseBody } from '../utils/validate.js';

const createSchema = z.object({
  clubId: z.string().uuid(),
  message: z.string().optional(),
});

export async function list(req, res) {
  const joinRequests = await joinRequestService.listJoinRequests(req.auth.user);
  sendSuccess(res, { joinRequests });
}

export async function create(req, res) {
  const body = parseBody(createSchema, req.body);
  const row = await joinRequestService.createJoinRequest(body, req.auth.user.id);
  sendSuccess(res, { joinRequest: mapJoinRequest(row) }, 201);
}

export async function approve(req, res) {
  const row = await joinRequestService.approveJoinRequest(req.params.id, req.auth.user);
  sendSuccess(res, { joinRequest: mapJoinRequest(row) });
}

export async function reject(req, res) {
  const row = await joinRequestService.rejectJoinRequest(req.params.id, req.auth.user);
  sendSuccess(res, { joinRequest: mapJoinRequest(row) });
}
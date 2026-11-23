import { z } from 'zod';
import * as tournamentService from '../services/tournamentService.js';
import { mapTournament } from '../utils/mappers.js';
import { sendSuccess } from '../utils/response.js';
import { parseBody } from '../utils/validate.js';
import { forbidden } from '../utils/errors.js';

const scoring = z.enum(['stroke', 'stableford', 'match_play', 'scramble']);

const createSchema = z.object({
  clubId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  entryLimit: z.number().int().min(0).optional(),
  scoringFormat: scoring.optional(),
});

const patchSchema = createSchema.partial().omit({ clubId: true });

export async function list(req, res) {
  const clubId = req.query.clubId;
  if (req.auth.user.role === 'club_admin' && clubId && req.auth.user.club_id !== clubId) {
    throw forbidden();
  }
  const tournaments = await tournamentService.listTournaments(clubId || undefined);
  sendSuccess(res, { tournaments });
}

export async function create(req, res) {
  if (req.auth.user.role === 'player') {
    throw forbidden();
  }
  const body = parseBody(createSchema, req.body);
  tournamentService.assertClubAccess(req.auth.user, body.clubId);
  const row = await tournamentService.createTournament(body, req.auth.user.id);
  sendSuccess(res, { tournament: mapTournament(row) }, 201);
}

export async function patch(req, res) {
  const body = parseBody(patchSchema, req.body);
  const existing = await tournamentService.getTournamentOrThrow(req.params.id);
  tournamentService.assertClubAccess(req.auth.user, existing.club_id);
  const row = await tournamentService.updateTournament(req.params.id, body);
  sendSuccess(res, { tournament: mapTournament(row) });
}

export async function publish(req, res) {
  const existing = await tournamentService.getTournamentOrThrow(req.params.id);
  tournamentService.assertClubAccess(req.auth.user, existing.club_id);
  const row = await tournamentService.publishTournament(req.params.id);
  sendSuccess(res, { tournament: mapTournament(row) });
}

export async function close(req, res) {
  const existing = await tournamentService.getTournamentOrThrow(req.params.id);
  tournamentService.assertClubAccess(req.auth.user, existing.club_id);
  const row = await tournamentService.closeTournament(req.params.id);
  sendSuccess(res, { tournament: mapTournament(row) });
}

export async function register(req, res) {
  const existing = await tournamentService.getTournamentOrThrow(req.params.id);
  if (req.auth.user.role !== 'player' && req.auth.user.role !== 'club_admin') {
    tournamentService.assertClubAccess(req.auth.user, existing.club_id);
  }
  const registration = await tournamentService.registerForTournament(
    req.params.id,
    req.auth.user.id,
  );
  sendSuccess(res, { registration }, 201);
}
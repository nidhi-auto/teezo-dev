import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { requireSuperAdmin } from '../middleware/authorize.js';
import * as authController from '../controllers/authController.js';
import * as clubAdminController from '../controllers/clubAdminController.js';
import * as clubController from '../controllers/clubController.js';
import * as playerController from '../controllers/playerController.js';
import * as userController from '../controllers/userController.js';
import * as tournamentController from '../controllers/tournamentController.js';
import * as invitationController from '../controllers/invitationController.js';
import * as joinRequestController from '../controllers/joinRequestController.js';
import * as membershipService from '../services/membershipService.js';
import * as tournamentService from '../services/tournamentService.js';
import { mapMembership, mapRegistration } from '../utils/mappers.js';
import { sendSuccess } from '../utils/response.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.post('/auth/register', asyncHandler(authController.register));
router.post('/auth/login', asyncHandler(authController.login));
router.post('/auth/google', asyncHandler(authController.google));
router.post('/auth/forgot-password', asyncHandler(authController.forgotPassword));
router.post('/auth/logout', requireAuth, asyncHandler(authController.logout));
router.get('/auth/me', requireAuth, asyncHandler(authController.me));

router.get('/club-admins', requireAuth, requireSuperAdmin, asyncHandler(clubAdminController.list));
router.post('/club-admins', requireAuth, requireSuperAdmin, asyncHandler(clubAdminController.create));
router.patch('/club-admins/:id', requireAuth, requireSuperAdmin, asyncHandler(clubAdminController.patch));
router.post(
  '/club-admins/:id/deactivate',
  requireAuth,
  requireSuperAdmin,
  asyncHandler(clubAdminController.deactivate),
);

router.get('/clubs', requireAuth, asyncHandler(clubController.list));
router.post('/clubs', requireAuth, requireSuperAdmin, asyncHandler(clubController.create));

router.get('/players', requireAuth, asyncHandler(playerController.list));
router.post('/clubs/:id/players', requireAuth, asyncHandler(playerController.create));
router.patch('/players/:id', requireAuth, asyncHandler(playerController.patch));
router.delete(
  '/clubs/:id/players/:userId',
  requireAuth,
  asyncHandler(playerController.removeFromClub),
);

router.patch('/users/:id', requireAuth, asyncHandler(userController.patchUser));
router.get('/users/:id/settings', requireAuth, asyncHandler(userController.getSettings));
router.put('/users/:id/settings', requireAuth, asyncHandler(userController.putSettings));

router.get('/tournaments', requireAuth, asyncHandler(tournamentController.list));
router.post('/tournaments', requireAuth, asyncHandler(tournamentController.create));
router.patch('/tournaments/:id', requireAuth, asyncHandler(tournamentController.patch));
router.post('/tournaments/:id/publish', requireAuth, asyncHandler(tournamentController.publish));
router.post('/tournaments/:id/close', requireAuth, asyncHandler(tournamentController.close));
router.post(
  '/tournaments/:id/registrations',
  requireAuth,
  asyncHandler(tournamentController.register),
);

router.get('/invitations', requireAuth, asyncHandler(invitationController.list));
router.post('/invitations', requireAuth, asyncHandler(invitationController.create));
router.post('/invitations/:id/accept', requireAuth, asyncHandler(invitationController.accept));
router.post('/invitations/:id/decline', requireAuth, asyncHandler(invitationController.decline));

router.get('/join-requests', requireAuth, asyncHandler(joinRequestController.list));
router.post('/join-requests', requireAuth, asyncHandler(joinRequestController.create));
router.post('/join-requests/:id/approve', requireAuth, asyncHandler(joinRequestController.approve));
router.post('/join-requests/:id/reject', requireAuth, asyncHandler(joinRequestController.reject));

router.get(
  '/memberships',
  requireAuth,
  asyncHandler(async (req, res) => {
    const rows = await membershipService.listMembershipsForActor(req.auth.user);
    sendSuccess(res, { memberships: rows.map(mapMembership) });
  }),
);

router.get(
  '/registrations',
  requireAuth,
  asyncHandler(async (req, res) => {
    const rows = await tournamentService.listRegistrationsForActor(req.auth.user);
    sendSuccess(res, { registrations: rows.map(mapRegistration) });
  }),
);

export default router;
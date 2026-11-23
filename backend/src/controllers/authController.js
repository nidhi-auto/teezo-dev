import * as authService from '../services/authService.js';
import { mapUser } from '../utils/mappers.js';
import { sendSuccess } from '../utils/response.js';
import { parseBody, registerSchema, loginSchema, forgotPasswordSchema, googleAuthSchema } from '../utils/validate.js';

export async function register(req, res) {
  const body = parseBody(registerSchema, req.body);
  const data = await authService.register(body);
  sendSuccess(res, data, 201);
}

export async function login(req, res) {
  const body = parseBody(loginSchema, req.body);
  const data = await authService.login(body);
  sendSuccess(res, data);
}

export async function google(req, res) {
  const body = parseBody(googleAuthSchema, req.body);
  const data = await authService.googleSignIn(body);
  sendSuccess(res, data);
}

export async function forgotPassword(req, res) {
  const body = parseBody(forgotPasswordSchema, req.body);
  await authService.forgotPassword(body);
  sendSuccess(res, { ok: true });
}

export async function logout(_req, res) {
  sendSuccess(res, null, 204);
}

export async function me(req, res) {
  sendSuccess(res, { user: mapUser(req.auth.user) });
}
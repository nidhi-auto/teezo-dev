import {
  cognitoSignUp,
  cognitoLogin,
  cognitoForgotPassword,
  resolveGoogleProfile,
  ensureCognitoGoogleUser,
  decodeIdTokenSub,
} from '../utils/cognitoAuth.js';
import { isCognitoConfigured } from '../utils/config.js';
import * as userService from './userService.js';
import { mapUser } from '../utils/mappers.js';
import { badRequest, serviceUnavailable } from '../utils/errors.js';

function authResponse(tokens, userRow) {
  return {
    ...tokens,
    user: mapUser(userRow),
  };
}

export async function register({ name, email, password, role }) {
  if (!isCognitoConfigured()) {
    throw serviceUnavailable();
  }
  const existing = await userService.findUserByEmail(email);
  if (existing) {
    throw badRequest('An account with this email already exists.');
  }
  const total = await userService.countUsers();
  let assignedRole = role || 'player';
  if (total === 0) {
    assignedRole = 'super_admin';
  } else if (assignedRole !== 'player') {
    assignedRole = 'player';
  }

  const cognitoSub = await cognitoSignUp(email, password, name);

  const user = await userService.createUser({
    name,
    email,
    role: assignedRole,
    cognitoSub,
  });

  const tokens = await cognitoLogin(email, password);
  const sub = decodeIdTokenSub(tokens.idToken) || cognitoSub;
  if (sub) {
    await userService.syncCognitoSub(user.id, sub);
  }
  const fresh = await userService.findUserById(user.id);
  return authResponse(tokens, fresh);
}

export async function login({ email, password }) {
  const tokens = await cognitoLogin(email, password);
  let user = await userService.findUserByEmail(email);
  const sub = decodeIdTokenSub(tokens.idToken);
  if (!user) {
    const total = await userService.countUsers();
    user = await userService.createUser({
      name: email.split('@')[0],
      email,
      role: total === 0 ? 'super_admin' : 'player',
      cognitoSub: sub,
    });
  } else if (!user.active) {
    throw badRequest('This account is deactivated.');
  }
  if (sub && user.cognito_sub !== sub) {
    await userService.syncCognitoSub(user.id, sub);
  }
  const fresh = await userService.findUserById(user.id);
  return authResponse(tokens, fresh);
}

export async function forgotPassword({ email }) {
  await cognitoForgotPassword(email);
  return { ok: true };
}

export async function googleSignIn(body) {
  const profile = await resolveGoogleProfile(body);
  const email = profile.email;
  const name = profile.name || email;
  const googleSub = profile.sub;
  if (!email) {
    throw badRequest('Google account must include an email.');
  }

  let user = await userService.findUserByEmail(email);
  if (!user) {
    const total = await userService.countUsers();
    const role = total === 0 ? 'super_admin' : 'player';
    user = await userService.createUser({
      name,
      email,
      role,
      cognitoSub: null,
    });
  } else if (name && user.name !== name) {
    user = await userService.updateUserProfile(user.id, { name });
  }

  const tokens = await ensureCognitoGoogleUser(email, name, googleSub);
  const sub = decodeIdTokenSub(tokens.idToken);
  if (sub) {
    await userService.syncCognitoSub(user.id, sub);
  }
  const fresh = await userService.findUserById(user.id);
  return authResponse(tokens, fresh);
}
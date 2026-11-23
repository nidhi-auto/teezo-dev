import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  AdminConfirmSignUpCommand,
  AdminInitiateAuthCommand,
  AdminCreateUserCommand,
  AdminLinkProviderForUserCommand,
  AdminSetUserPasswordCommand,
  ForgotPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { OAuth2Client } from 'google-auth-library';
import { config, isCognitoConfigured, isGoogleConfigured } from './config.js';
import { AppError, serviceUnavailable, unauthorized } from './errors.js';

let cognitoClient = null;
let jwks = null;
function getCognitoClient() {
  if (!isCognitoConfigured()) {
    return null;
  }
  if (!cognitoClient) {
    cognitoClient = new CognitoIdentityProviderClient({ region: config.cognito.region });
  }
  return cognitoClient;
}

function getJwks() {
  if (!isCognitoConfigured()) {
    return null;
  }
  if (!jwks) {
    const issuer = `https://cognito-idp.${config.cognito.region}.amazonaws.com/${config.cognito.userPoolId}`;
    jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
  }
  return jwks;
}

import crypto from 'node:crypto';

export function secretHashFor(username) {
  if (!config.cognito.clientSecret) {
    return undefined;
  }
  return crypto
    .createHmac('SHA256', config.cognito.clientSecret)
    .update(username + config.cognito.clientId)
    .digest('base64');
}

export async function verifyAccessToken(token) {
  if (!token) {
    throw unauthorized();
  }
  if (!isCognitoConfigured()) {
    throw unauthorized();
  }
  try {
    const issuer = `https://cognito-idp.${config.cognito.region}.amazonaws.com/${config.cognito.userPoolId}`;
    // Access tokens often omit `aud` and carry `client_id` instead.
    const { payload } = await jwtVerify(token, getJwks(), {
      issuer,
    });
    const clientOk =
      payload.client_id === config.cognito.clientId ||
      payload.aud === config.cognito.clientId ||
      (Array.isArray(payload.aud) && payload.aud.includes(config.cognito.clientId));
    if (!clientOk) {
      throw unauthorized();
    }
    return payload;
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    throw unauthorized();
  }
}

export function assertCognitoForExchange() {
  if (!isCognitoConfigured()) {
    throw serviceUnavailable();
  }
}

export function assertGoogleForExchange() {
  if (!isGoogleConfigured()) {
    throw serviceUnavailable();
  }
}

function mapAuthResult(authResult) {
  return {
    accessToken: authResult.AccessToken,
    idToken: authResult.IdToken,
    refreshToken: authResult.RefreshToken,
    expiresIn: authResult.ExpiresIn ?? 3600,
  };
}

export async function cognitoSignUp(email, password, name) {
  assertCognitoForExchange();
  const client = getCognitoClient();
  const params = {
    ClientId: config.cognito.clientId,
    Username: email,
    Password: password,
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'name', Value: name },
    ],
  };
  const hash = secretHashFor(email);
  if (hash) {
    params.SecretHash = hash;
  }
  try {
    const result = await client.send(new SignUpCommand(params));
    try {
      await client.send(
        new AdminConfirmSignUpCommand({
          UserPoolId: config.cognito.userPoolId,
          Username: email,
        }),
      );
    } catch {
      // Pool may auto-verify
    }
    return result.UserSub;
  } catch (err) {
    if (err.name === 'UsernameExistsException') {
      throw new AppError(409, 'An account with this email already exists.');
    }
    throw new AppError(400, 'Registration failed. Try a different password or email.');
  }
}

export async function cognitoLogin(email, password) {
  assertCognitoForExchange();
  const client = getCognitoClient();
  const authParameters = { USERNAME: email, PASSWORD: password };
  const hash = secretHashFor(email);
  if (hash) {
    authParameters.SECRET_HASH = hash;
  }
  try {
    const result = await client.send(
      new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: config.cognito.clientId,
        AuthParameters: authParameters,
      }),
    );
    if (!result.AuthenticationResult) {
      throw new AppError(401, 'Sign-in failed. Check your email and password.');
    }
    return mapAuthResult(result.AuthenticationResult);
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError(401, 'Sign-in failed. Check your email and password.');
  }
}

export async function cognitoForgotPassword(email) {
  assertCognitoForExchange();
  const client = getCognitoClient();
  const params = {
    ClientId: config.cognito.clientId,
    Username: email,
  };
  const hash = secretHashFor(email);
  if (hash) {
    params.SecretHash = hash;
  }
  try {
    await client.send(new ForgotPasswordCommand(params));
  } catch {
    // Do not reveal whether user exists
  }
}

async function verifyGoogleIdToken(idToken) {
  assertGoogleForExchange();
  const client = new OAuth2Client(config.google.clientId);
  const ticket = await client.verifyIdToken({
    idToken,
    audience: config.google.clientId,
  });
  return ticket.getPayload();
}

async function exchangeGoogleCode(code, redirectUri) {
  assertGoogleForExchange();
  const client = new OAuth2Client(
    config.google.clientId,
    config.google.clientSecret,
    redirectUri,
  );
  const { tokens } = await client.getToken(code);
  if (!tokens.id_token) {
    throw new AppError(401, 'Sign-in failed. Try again.');
  }
  return verifyGoogleIdToken(tokens.id_token);
}

export async function resolveGoogleProfile(body) {
  if (body.idToken) {
    try {
      return await verifyGoogleIdToken(body.idToken);
    } catch {
      throw new AppError(401, 'Sign-in failed. Try again.');
    }
  }
  try {
    return await exchangeGoogleCode(body.code, body.redirectUri);
  } catch {
    throw new AppError(401, 'Sign-in failed. Try again.');
  }
}

export async function cognitoAdminAuthAfterGoogle(email) {
  assertCognitoForExchange();
  const client = getCognitoClient();
  try {
    const result = await client.send(
      new AdminInitiateAuthCommand({
        UserPoolId: config.cognito.userPoolId,
        ClientId: config.cognito.clientId,
        AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: email,
          PASSWORD: await getOrSetGoogleBridgePassword(email),
        },
      }),
    );
    if (result.AuthenticationResult) {
      return mapAuthResult(result.AuthenticationResult);
    }
  } catch {
    // fall through to create/link
  }
  return null;
}

const googleBridgePasswords = new Map();

async function getOrSetGoogleBridgePassword(email) {
  if (!googleBridgePasswords.has(email)) {
    googleBridgePasswords.set(email, crypto.randomBytes(32).toString('base64url'));
  }
  return googleBridgePasswords.get(email);
}

export async function ensureCognitoGoogleUser(email, name, googleSub) {
  assertCognitoForExchange();
  const client = getCognitoClient();
  const bridgePassword = await getOrSetGoogleBridgePassword(email);

  try {
    await client.send(
      new AdminCreateUserCommand({
        UserPoolId: config.cognito.userPoolId,
        Username: email,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'name', Value: name || email },
        ],
        MessageAction: 'SUPPRESS',
      }),
    );
    await client.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: config.cognito.userPoolId,
        Username: email,
        Password: bridgePassword,
        Permanent: true,
      }),
    );
  } catch (err) {
    if (err.name !== 'UsernameExistsException') {
      throw serviceUnavailable();
    }
    try {
      await client.send(
        new AdminSetUserPasswordCommand({
          UserPoolId: config.cognito.userPoolId,
          Username: email,
          Password: bridgePassword,
          Permanent: true,
        }),
      );
    } catch {
      throw serviceUnavailable();
    }
  }

  try {
    await client.send(
      new AdminLinkProviderForUserCommand({
        UserPoolId: config.cognito.userPoolId,
        DestinationUser: {
          ProviderName: 'Cognito',
          ProviderAttributeValue: email,
        },
        SourceUser: {
          ProviderName: 'Google',
          ProviderAttributeName: 'Cognito_Subject',
          ProviderAttributeValue: googleSub,
        },
      }),
    );
  } catch {
    // Link may already exist or Google IdP not configured
  }

  const tokens = await cognitoAdminAuthAfterGoogle(email);
  if (tokens) {
    return tokens;
  }

  const authParameters = { USERNAME: email, PASSWORD: bridgePassword };
  try {
    const result = await client.send(
      new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: config.cognito.clientId,
        AuthParameters: authParameters,
      }),
    );
    if (result.AuthenticationResult) {
      return mapAuthResult(result.AuthenticationResult);
    }
  } catch {
    throw serviceUnavailable();
  }
  throw serviceUnavailable();
}

export function decodeIdTokenSub(idToken) {
  if (!idToken) {
    return null;
  }
  const parts = idToken.split('.');
  if (parts.length < 2) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return payload.sub || null;
  } catch {
    return null;
  }
}
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 3001,
  databaseUrl: process.env.DATABASE_URL || '',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  cognito: {
    userPoolId: process.env.COGNITO_USER_POOL_ID || '',
    clientId: process.env.COGNITO_CLIENT_ID || '',
    clientSecret: process.env.COGNITO_CLIENT_SECRET || '',
    region: process.env.COGNITO_REGION || 'us-east-1',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  },
};

export function isCognitoConfigured() {
  return Boolean(config.cognito.userPoolId && config.cognito.clientId && config.cognito.region);
}

export function isGoogleConfigured() {
  return Boolean(
    isCognitoConfigured() &&
      config.google.clientId &&
      config.google.clientSecret,
  );
}
# Teezo API (release 1.0.0)

Node.js 20+ Express API with PostgreSQL and Amazon Cognito authentication.

## Local setup

1. Copy `backend/.env.example` to `backend/.env` and set values (names only documented here):
   - `PORT`
   - `DATABASE_URL`
   - `CORS_ORIGIN`
   - `COGNITO_USER_POOL_ID`
   - `COGNITO_CLIENT_ID`
   - `COGNITO_CLIENT_SECRET` (optional if the app client has no secret)
   - `COGNITO_REGION`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

2. Install dependencies:

   ```bash
   cd backend && npm install
   ```

3. Run migrations:

   ```bash
   npm run migrate
   ```

4. Start the server:

   ```bash
   npm run dev
   ```

API base path: `http://localhost:3001/api/v1`

## Scripts

| Script    | Description                          |
| --------- | ------------------------------------ |
| `start`   | Run API                              |
| `dev`     | Run API with `node --watch`          |
| `migrate` | Apply SQL files in `migrations/`     |
| `lint`    | ESLint                               |

## Auth behavior

- Email/password and Google sign-in exchange credentials for Cognito JWTs via `POST /api/v1/auth/*`.
- Protected routes require `Authorization: Bearer <accessToken>` verified against the Cognito user pool JWKS.
- When Cognito or Google env values are missing, auth exchange endpoints return **503** (`Sign-in is not set up yet.`). Protected routes return **401** without a valid JWT.

## Database

Schema is created by `migrations/001_init.sql` (no seed data). The first registered user becomes `super_admin` when the database has no users yet.
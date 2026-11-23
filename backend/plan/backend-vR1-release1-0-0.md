# Backend Plan — Teezo R1 / release 1-0-0

**Mode:** Local with server (`None (With Server Only)`) · `code_pr`  
**UI root:** `.` (repo-root Vite SPA) · **API root:** `backend/`  
**Detected language:** none → greenfield Node Express + PostgreSQL  
**Auth:** Amazon Cognito (email/password + Google SSO) — no prior production auth

## Assumptions

1. Empty DB after migrations; no seed scripts. Super Admin needs `POST /api/v1/clubs` plus a create dialog on ClubsPage so club admins can be assigned.
2. First Super Admin is provisioned via Cognito signup with role `super_admin` set in Postgres (bootstrap: first registered user if none exists, else `player` on self-register; club admins created by SA).
3. User `password` is never returned from the API.
4. Settings prefs (`emailNotifications`, `tournamentAlerts`) persist via `user_settings` table.
5. Runtime `npm run build` / `runtime-verification.json` skipped this turn per LaunchPad no-prod-build / Done rules; lint + structural deliverables still produced where applicable.

## Preview artifact removal

| File | Action | Reason |
|------|--------|--------|
| `src/data/seed.ts` | delete | DUMMY domain seed |
| `src/data/store.ts` | replace | in-memory DB → API client + hydrated state |
| `src/hooks/useSimulatedLoad.ts` | replace | real fetch lifecycle |
| `src/lib/auth.tsx` | replace | Cognito/session restore |
| `src/pages/auth/*` | wire | live auth + Google callback |
| `src/pages/SettingsPage.tsx` | wire | user settings API |
| Demo login chips on LoginPage | remove | preview shortcut |

## Existing API inventory

| Method | Path | Handler | Models | Auth |
|--------|------|---------|--------|------|
| — | — | *(none — empty clone)* | — | — |

All endpoints below are **new (justify: greenfield empty apiRoot)**.

## Existing schema inventory

No tables. New schema only.

## Schema change plan

| Table | Disposition | FKs | Migration |
|-------|-------------|-----|-----------|
| `users` | new (justify: no users table) | — | `001_init.sql` |
| `clubs` | new | `admin_user_id → users.id` | `001_init.sql` |
| `club_memberships` | new | `club_id→clubs`, `user_id→users` | `001_init.sql` |
| `tournaments` | new | `club_id→clubs`, `created_by_user_id→users` | `001_init.sql` |
| `tournament_registrations` | new | `tournament_id→tournaments`, `user_id→users` | `001_init.sql` |
| `invitations` | new | `club_id→clubs`, `invited_by_user_id→users` | `001_init.sql` |
| `join_requests` | new | `club_id→clubs`, `player_user_id→users`, `reviewed_by_user_id→users` | `001_init.sql` |
| `user_settings` | new | `user_id→users` | `001_init.sql` |

## Frontend call inventory

| # | Screen | Action | Endpoint | Disposition |
|---|--------|--------|----------|-------------|
| 1 | LoginPage | auth login | `POST /api/v1/auth/login` | new |
| 2 | LoginPage / callback | Google SSO | `POST /api/v1/auth/google` | new |
| 3 | RegisterPage | register | `POST /api/v1/auth/register` | new |
| 4 | ForgotPasswordPage | forgot password | `POST /api/v1/auth/forgot-password` | new |
| 5 | AuthProvider | session restore | `GET /api/v1/auth/me` | new |
| 6 | AuthProvider | sign out | `POST /api/v1/auth/logout` | new |
| 7 | ClubAdminsPage | list | `GET /api/v1/club-admins` | new |
| 8 | ClubAdminsPage | create | `POST /api/v1/club-admins` | new |
| 9 | ClubAdminsPage | update | `PATCH /api/v1/club-admins/:id` | new |
| 10 | ClubAdminsPage | deactivate | `POST /api/v1/club-admins/:id/deactivate` | new |
| 11 | ClubsPage / Browse | list clubs | `GET /api/v1/clubs` | new |
| 12 | ClubsPage | create club | `POST /api/v1/clubs` | new |
| 13 | PlayersPage | list players | `GET /api/v1/players` / `GET /api/v1/clubs/:id/players` | new |
| 14 | PlayersPage | create player | `POST /api/v1/clubs/:id/players` | new |
| 15 | PlayersPage | update | `PATCH /api/v1/players/:id` | new |
| 16 | PlayersPage | remove from club | `DELETE /api/v1/clubs/:id/players/:userId` | new |
| 17 | SettingsPage | update profile | `PATCH /api/v1/users/:id` | new |
| 18 | SettingsPage | get/save prefs | `GET/PUT /api/v1/users/:id/settings` | new |
| 19 | TournamentsPage | list | `GET /api/v1/tournaments` | new |
| 20 | TournamentsPage | create | `POST /api/v1/tournaments` | new |
| 21 | TournamentsPage | update | `PATCH /api/v1/tournaments/:id` | new |
| 22 | TournamentsPage | publish | `POST /api/v1/tournaments/:id/publish` | new |
| 23 | TournamentsPage | close | `POST /api/v1/tournaments/:id/close` | new |
| 24 | TournamentDetail | register | `POST /api/v1/tournaments/:id/registrations` | new |
| 25 | InvitationsPage | list/send | `GET/POST /api/v1/invitations` | new |
| 26 | MyInvitesPage | accept/decline | `POST /api/v1/invitations/:id/accept` · `…/decline` | new |
| 27 | JoinRequestsPage | list/approve/reject | `GET /api/v1/join-requests` · `POST …/approve` · `…/reject` | new |
| 28 | BrowseClubsPage | submit join | `POST /api/v1/join-requests` | new |
| 29 | Health | smoke | `GET /api/v1/health` | new |

Note: path verbs `publish`/`close`/`deactivate`/`accept`/`decline`/`approve`/`reject` mirror the preview DUMMY contracts; nested under resource ids.

## Shared utility layer

`backend/src/utils/`: `config.js`, `db.js`, `logger.js`, `errors.js`, `validate.js`, `response.js`, `cognitoAuth.js`, `asyncHandler.js`

## Five components

| Component | Application | Infrastructure |
|-----------|-------------|----------------|
| Auth | Cognito JWKS + Google `POST /api/v1/auth/google` + login/register/forgot | N/A — local (env-referenced pool) |
| Network | cors, helmet, rate-limit, trust proxy | N/A — local |
| Compute | Express `backend/src` | N/A — local |
| Storage | N/A — no uploads | N/A — no uploads |
| Database | PostgreSQL + SQL migrations | N/A — local |
| Frontend Hosting | Vite local | N/A — local |

## Environment examples

**backend/.env.example:** `PORT`, `DATABASE_URL`, `CORS_ORIGIN`, `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, `COGNITO_REGION`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `COGNITO_CLIENT_SECRET` (if needed for admin APIs)

**Root .env.example:** `VITE_API_BASE_URL`, `VITE_GOOGLE_CLIENT_ID`, `VITE_OAUTH_REDIRECT_URI`

## Integration steps

1. Bootstrap SPA from `launchpad-frontend/` → `.`
2. Remove DUMMY artifacts; add `src/lib/api.ts` + API-backed store/auth
3. Implement Express API + migrations
4. Wire Google callback `/auth/callback`
5. Write compliance + flow-verification + schema-changes

## REQ mapping (summary)

- REQ-001: auth-panel golden-hour SVG (FE catch-up)
- REQ-002: base release scope
- REQ-003–042: FE catch-up ADDED paths present under `.`
- REQ-043–080: DUMMY replacements via live API/auth

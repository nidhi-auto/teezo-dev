# Runtime verification — Teezo R1

| Check | Result |
|-------|--------|
| mode | express |
| bootOk | true |
| healthOk | true (GET /api/v1/health → 200) |
| lintOk | true |
| uiStack | web |
| frontendVerifyCommand | vite production compile (LaunchPad host) |
| backendBuildOk | null (no backend build script) |
| mockScan.leftoverCount | 0 |
| authChecks.protectedRoutes401 | true |
| authChecks.googleExchange4xx | true |
| authChecks.credentialsMissing | true |

## Endpoints

| Method | Path | Status |
|--------|------|--------|
| GET | /api/v1/health | 200 |
| POST | /api/v1/auth/register | 503 |
| POST | /api/v1/auth/login | 503 |
| POST | /api/v1/auth/google | 400 |
| POST | /api/v1/auth/google | 401 |
| POST | /api/v1/auth/forgot-password | 503 |
| POST | /api/v1/auth/logout | 401 |
| GET | /api/v1/auth/me | 401 |
| GET | /api/v1/clubs | 401 |
| POST | /api/v1/clubs | 401 |
| GET | /api/v1/club-admins | 401 |
| POST | /api/v1/club-admins | 401 |
| PATCH | /api/v1/club-admins/00000000-0000-0000-0000-000000000001 | 401 |
| POST | /api/v1/club-admins/00000000-0000-0000-0000-000000000001/deactivate | 401 |
| GET | /api/v1/players | 401 |
| POST | /api/v1/clubs/00000000-0000-0000-0000-000000000001/players | 401 |
| PATCH | /api/v1/players/00000000-0000-0000-0000-000000000001 | 401 |
| DELETE | /api/v1/clubs/00000000-0000-0000-0000-000000000001/players/00000000-0000-0000-0000-000000000002 | 401 |
| PATCH | /api/v1/users/00000000-0000-0000-0000-000000000001 | 401 |
| GET | /api/v1/users/00000000-0000-0000-0000-000000000001/settings | 401 |
| PUT | /api/v1/users/00000000-0000-0000-0000-000000000001/settings | 401 |
| GET | /api/v1/tournaments | 401 |
| POST | /api/v1/tournaments | 401 |
| PATCH | /api/v1/tournaments/00000000-0000-0000-0000-000000000001 | 401 |
| POST | /api/v1/tournaments/00000000-0000-0000-0000-000000000001/publish | 401 |
| POST | /api/v1/tournaments/00000000-0000-0000-0000-000000000001/close | 401 |
| POST | /api/v1/tournaments/00000000-0000-0000-0000-000000000001/registrations | 401 |
| GET | /api/v1/invitations | 401 |
| POST | /api/v1/invitations | 401 |
| POST | /api/v1/invitations/00000000-0000-0000-0000-000000000001/accept | 401 |
| POST | /api/v1/invitations/00000000-0000-0000-0000-000000000001/decline | 401 |
| GET | /api/v1/join-requests | 401 |
| POST | /api/v1/join-requests | 401 |
| POST | /api/v1/join-requests/00000000-0000-0000-0000-000000000001/approve | 401 |
| POST | /api/v1/join-requests/00000000-0000-0000-0000-000000000001/reject | 401 |
| GET | /api/v1/memberships | 401 |
| GET | /api/v1/registrations | 401 |

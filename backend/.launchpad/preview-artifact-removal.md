# Preview artifact removal report

| File | Action | Reason |
|------|--------|--------|
| `src/data/seed.ts` | delete | DUMMY domain seed |
| `src/data/store.ts` | replace | API client + hydrate |
| `src/hooks/useSimulatedLoad.ts` | replace | real hydrate lifecycle |
| `src/lib/auth.tsx` | replace | Cognito session + Google SSO |
| `src/lib/api.ts` | new | live fetch + token storage |
| `src/pages/auth/LoginPage.tsx` | wire | remove demo chips; Google OAuth |
| `src/pages/auth/RegisterPage.tsx` | wire | POST /auth/register |
| `src/pages/auth/ForgotPasswordPage.tsx` | wire | Cognito forgot-password |
| `src/pages/SettingsPage.tsx` | wire | user settings API |
| `src/pages/super-admin/ClubsPage.tsx` | extend | create club for empty DB |
| Demo login / resetStore | remove | preview shortcuts |

Field shapes captured: User, Club, Tournament, Invitation, JoinRequest, ClubMembership, TournamentRegistration, user settings prefs.

Post-cleanup scan: 0 leftover(s)

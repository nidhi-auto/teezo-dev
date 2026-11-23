# Product

## Register

product

## Users

Three personas share Teezo:

- **Super Admin** — platform owner who creates Club Admins and oversees every club, player, and tournament.
- **Club Admin** — runs one club: roster, invitations, join requests, and tournaments (draft → live → closed).
- **Player** — joins clubs (invite or request), browses live tournaments, and plays via web or the Teezo mobile experience.

Primary workflow: Club Admin publishes a live tournament → players join the club and register → Super Admin can audit the whole network.

## Product Purpose

Teezo is the clubhouse operating system for golf clubs and tournaments. It replaces scattered spreadsheets, group chats, and paper invite lists with role-aware tools for admins and a clear path for players to find live events and get on the roster.

Success: a Club Admin can invite players, approve join requests, and go live with a tournament in one sitting; a Player can accept an invite or request to join and see their clubs and live events without admin friction.

## Brand Personality

Playful, professional, crisp — “first-tee confidence.” Friendly without being childish; precise without country-club stiffness.

## Anti-references

- Generic indigo SaaS dashboards with Inter everywhere
- Country-club gold / navy crest kitsch
- Cream/parchment “editorial golf magazine” layouts
- Purple gradient startup chrome
- Identical icon+title+blurb card grids as the whole product

## Design Principles

1. **Role clarity first** — every screen makes the active persona and club scope obvious.
2. **Live is the verb** — tournament status (draft / live / closed) is the primary object of attention, not vanity metrics.
3. **Invite → approve → play** — the membership loop is short, visible, and reversible with clear states.
4. **Task density for admins, calm for players** — Club/Super Admin surfaces are compact tables; Player surfaces breathe more, especially on mobile.
5. **Explicit save** — roster and tournament edits persist only on Save/Submit.

## Accessibility & Inclusion

WCAG AA contrast targets; visible focus rings on brand; `prefers-reduced-motion` respected; form errors announced in plain language; touch targets ≥44px on player mobile routes.

## Primary journeys

| Journey | Persona job | Entry | Success (preview) | Loading | Empty | Error |
|---|---|---|---|---|---|---|
| Demo sign-in | Enter as SA / CA / Player | `/login` | Session set; routed to role home | yes | n/a | yes (bad creds) |
| Create Club Admin | SA provisions CA | `/app/club-admins` → New | Admin appears in list (active) | yes | yes | yes (validation) |
| Manage players | CA creates / deactivates player | `/app/players` | Player on roster | yes | yes | yes |
| Invite player | CA emails invite | `/app/invitations` | Pending invite listed | yes | yes | yes |
| Join request review | CA approve/reject | `/app/join-requests` | Status updates; membership if approved | yes | yes | yes |
| Tournament lifecycle | CA draft → live → close | `/app/tournaments` | Status changes; players can join when live | yes | yes | yes |
| Browse & request join | Player finds live club | `/app/browse` | Join request pending | yes | yes | yes |
| Accept invitation | Player accepts/declines | `/app/my-invites` | Club membership added or invite declined | yes | yes | yes |
| Player mobile home | Player on phone shell | `/m` | Sees clubs, live events, invite badge | yes | yes | yes |
| Account settings | Any persona updates profile prefs | `/app/settings` | Saved toast after Save | yes | n/a | yes |

## Assumptions (open items)

- Players may self-register; Club Admins may also create player accounts.
- A Player may belong to multiple clubs.
- Tournaments carry name, dates, entry limit, scoring format, and status.
- Google sign-in creates an account without club pre-approval; club access still requires invite acceptance or approved join request.
- Invitations expire after 14 days; rejected join requests may re-apply after 30 days.
- Preview ships a responsive player mobile web shell; native iOS/Android ships later outside this tree.
- Backend belongs in LaunchPad backend lock — this preview is mock-only.

## Design genome

| Axis | Choice |
|---|---|
| Type personality | Geometric display (Sora) + humanist UI sans (Figtree) |
| Brand-color family | Fairway teal `#29D1B5` |
| Neutral temperature | Pure white surfaces + cool teal-tinted ink |
| Layout archetype | Admin: left rail + content; Player mobile: bottom tab shell; Marketing: full-bleed fairway hero |
| Density & shape | Compact admin tables; 12px soft radii; bordered panels over heavy shadows |
| Signature moment | **Live Fairway Board** — hole-strip pulse on live tournament detail |

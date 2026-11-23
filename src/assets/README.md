# Teezo design contract

## Design genome

| Axis | Choice | Rationale |
|------|--------|-----------|
| Type personality | Geometric display (Sora) + humanist UI (Figtree) | Modern clubhouse ops — sharp display, readable tables |
| Brand-color family | Course teal + ink navy accent | Fairway green without stock indigo; navy for authority CTAs |
| Neutral temperature | Cool teal-tinted neutrals | Surfaces lean mint-paper, not cream or charcoal |
| Layout archetype | Left sidebar app shell; full-bleed marketing hero | Ops density for CA/SA; brand-first landing |
| Density & shape | Soft 12px radii, bordered elevated surfaces, efficient rows | Approachable but task-first — not pill-heavy SaaS chrome |
| Signature moment | Live Fairway Board hole strip | Domain viz a golfer would describe later |

Diverges from stock SaaS (Inter + indigo + centered hero + three identical cards).

## Brand

- **Name:** Teezo
- **Positioning:** Clubhouse operations for golf — clubs, members, and live tournaments in one sheet.
- **Personality:** approachable · modern · guided · precise
- **Primary persona:** Club admin Morgan — publish a live tournament and seat members without spreadsheet churn.

## Product architecture (IA)

| Role | Top nav → surfaces |
|------|-------------------|
| Super admin | Overview, Club Admins, Clubs, All Players, All Tournaments, Settings |
| Club admin | Club Home, Players, Invitations, Join Requests, Tournaments, Settings |
| Player | Home, Browse Clubs, My Clubs, Invitations, My Requests, Mobile View, Settings |

Surfaces: list + filter, create/edit dialogs with explicit Save, detail with FairwayBoard, empty states, toast confirmations. Data is loaded from the live `/api/v1` backend.

## Typography

- Display: **Sora** — page titles, hero, section heads (`font-display`)
- Body/UI: **Figtree** — forms, tables, nav (`font-sans`)
- Scale: hero ~3.5–4.5rem · page title 1.5rem · section 1.125rem · body 0.9375rem · caption 0.75rem

## Color tokens

Consumed via Tailwind theme from `src/index.css` — components use role tokens only (`bg-primary`, `text-muted-foreground`, etc.). No raw hex in components.

## Motifs

- Fairway / hole strip (signature)
- Flag-on-tee / pin flag
- Sand bunker
- Soft mint surface bands on marketing
- Mark as brand hero signal (not nav-only)

**Visual register:** approachable + precise — bold flat shapes with soft volume ramps (not hand-drawn, not navy-crest kitsch).

### Auth panel art brief (`auth-panel.svg`)

1. **Subject:** Golden-hour first tee — pin on green, foreground tee marker, bunkers — “step onto the course.”
2. **Planes:** Dusk sky → tree line → rough/fairway → green/flag → tee in foreground. Portrait 720×1080 full-bleed (no rounded card frame).
3. **Light:** Upper-right sun wash; soft contact shadows under tee and bunkers.
4. **Palette:** Sky navy→peach→mint; fairway teal ramp; sand bunker; white/teal flag.
5. **Finish:** Soft sun glow + light grain; Medium detail tier.
6. **Job:** Brand orientation on login/register — distinct from morning `hero-fairway.svg`.

## Asset table

| File | Role | Why it exists |
|------|------|----------------|
| `logos/teezo-mark.svg` | Brand mark | Flag-on-tee monogram; hero + shell identity |
| `illustrations/hero-fairway.svg` | Marketing hero plane | Full-bleed fairway atmosphere for landing |
| `illustrations/empty-roster.svg` | Empty roster | Players/memberships empty state |
| `illustrations/empty-invites.svg` | Empty invites | Invitations empty state |
| `illustrations/auth-panel.svg` | Auth side panel (Medium) | Orient at sign-in: golden-hour first tee, flag, bunker — distinct from morning landing hero |
| `icons/nav-clubs.svg` | Nav glyph | Clubs / overview |
| `icons/nav-tournaments.svg` | Nav glyph | Tournament routes |
| `icons/nav-players.svg` | Nav glyph | Players / admins |
| `icons/nav-requests.svg` | Nav glyph | Invites / join requests |

Import SVGs as `<img src={…} alt="…" />` — never as React components.

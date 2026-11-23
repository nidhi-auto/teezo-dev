import { apiGetList, apiGetListOptional, apiRequest, apiRequestEntity } from '@/lib/api'
import type {
  AppState,
  Club,
  ClubMembership,
  Invitation,
  JoinRequest,
  ScoringFormat,
  Tournament,
  TournamentRegistration,
  User,
} from './types'

type Listener = () => void

const emptyState = (): AppState => ({
  users: [],
  clubs: [],
  tournaments: [],
  invitations: [],
  joinRequests: [],
  memberships: [],
  registrations: [],
  session: null,
})

let state: AppState = emptyState()
const listeners = new Set<Listener>()

let hydratePromise: Promise<void> | null = null
let hydrated = false
const hydrateListeners = new Set<Listener>()

function notify() {
  listeners.forEach((listener) => listener())
}

function notifyHydrate() {
  hydrateListeners.forEach((listener) => listener())
}

export function getState(): AppState {
  return state
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function isHydrated(): boolean {
  return hydrated
}

export function subscribeHydrate(listener: Listener): () => void {
  hydrateListeners.add(listener)
  return () => {
    hydrateListeners.delete(listener)
  }
}

export function resetHydrate(): void {
  hydrated = false
  hydratePromise = null
  state = emptyState()
  notify()
  notifyHydrate()
}

export function invalidateHydrate(): void {
  hydrated = false
  hydratePromise = null
}

function mergeUsers(...lists: User[][]): User[] {
  const map = new Map<string, User>()
  for (const list of lists) {
    for (const u of list) {
      map.set(u.id, u)
    }
  }
  return [...map.values()]
}

export function syncSessionUser(user: User | null): void {
  if (!user) {
    state = { ...emptyState(), session: null }
    notify()
    return
  }
  state = {
    ...state,
    session: { userId: user.id, signedInAt: new Date().toISOString() },
    users: mergeUsers(state.users, [user]),
  }
  notify()
}

export async function refreshAll(): Promise<void> {
  const [clubs, tournaments, invitations, joinRequests, players, clubAdmins, memberships, registrations] =
    await Promise.all([
      apiGetList<Club>('/api/v1/clubs'),
      apiGetList<Tournament>('/api/v1/tournaments'),
      apiGetList<Invitation>('/api/v1/invitations'),
      apiGetList<JoinRequest>('/api/v1/join-requests'),
      apiGetList<User>('/api/v1/players'),
      apiGetListOptional<User>('/api/v1/club-admins'),
      apiGetListOptional<ClubMembership>('/api/v1/memberships'),
      apiGetListOptional<TournamentRegistration>('/api/v1/registrations'),
    ])

  const sessionUserId = state.session?.userId
  const sessionUser = sessionUserId
    ? state.users.find((u) => u.id === sessionUserId)
    : undefined

  state = {
    ...state,
    clubs,
    tournaments,
    invitations,
    joinRequests,
    memberships,
    registrations,
    users: mergeUsers([...players, ...clubAdmins], sessionUser ? [sessionUser] : []),
  }
  notify()
}

export async function hydrate(): Promise<void> {
  if (hydrated) return
  if (!hydratePromise) {
    hydratePromise = refreshAll()
      .then(() => {
        hydrated = true
        notifyHydrate()
      })
      .catch((err) => {
        hydratePromise = null
        throw err
      })
  }
  return hydratePromise
}

function touchAfterMutation(): Promise<void> {
  return refreshAll()
}

export function getSessionUser(): User | null {
  if (!state.session) return null
  return state.users.find((u) => u.id === state.session!.userId) ?? null
}

export function getPlayersForClub(clubId: string): User[] {
  const memberIds = new Set(
    state.memberships
      .filter((m) => m.clubId === clubId && m.active)
      .map((m) => m.userId),
  )
  return state.users.filter((u) => u.role === 'player' && memberIds.has(u.id))
}

export function getClubs(): Club[] {
  return state.clubs
}

export function getTournaments(clubId?: string): Tournament[] {
  return clubId ? state.tournaments.filter((t) => t.clubId === clubId) : state.tournaments
}

export async function createClub(input: {
  name: string
  city: string
  state: string
  holes: number
  description: string
}): Promise<{ ok: true; club: Club } | { ok: false; error: string }> {
  try {
    const club = await apiRequestEntity<Club>('/api/v1/clubs', ['club'], {
      method: 'POST',
      body: JSON.stringify(input),
    })
    await touchAfterMutation()
    return { ok: true, club }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not create club.' }
  }
}

export async function createClubAdmin(input: {
  name: string
  email: string
  password: string
  clubId: string
}): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  try {
    const user = await apiRequestEntity<User>('/api/v1/club-admins', ['clubAdmin', 'user'], {
      method: 'POST',
      body: JSON.stringify(input),
    })
    await touchAfterMutation()
    return { ok: true, user }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not create club admin.' }
  }
}

export async function updateClubAdmin(
  userId: string,
  patch: Partial<Pick<User, 'name' | 'email' | 'clubId' | 'active'>>,
): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  try {
    const user = await apiRequestEntity<User>(`/api/v1/club-admins/${userId}`, ['clubAdmin', 'user'], {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    await touchAfterMutation()
    return { ok: true, user }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not update club admin.' }
  }
}

export async function deactivateClubAdmin(
  userId: string,
): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  try {
    const user = await apiRequestEntity<User>(`/api/v1/club-admins/${userId}/deactivate`, ['clubAdmin', 'user'], {
      method: 'POST',
    })
    await touchAfterMutation()
    return { ok: true, user }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not deactivate club admin.' }
  }
}

export async function updateUserProfile(
  userId: string,
  patch: Partial<Pick<User, 'name'>>,
): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  try {
    const user = await apiRequestEntity<User>(`/api/v1/users/${userId}`, ['user'], {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    await touchAfterMutation()
    return { ok: true, user }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not update profile.' }
  }
}

export async function createPlayerForClub(input: {
  clubId: string
  name: string
  email: string
  password?: string
  handicap?: number
}): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  try {
    const user = await apiRequestEntity<User>(`/api/v1/clubs/${input.clubId}/players`, ['player', 'user'], {
      method: 'POST',
      body: JSON.stringify({
        name: input.name,
        email: input.email,
        password: input.password,
        handicap: input.handicap,
      }),
    })
    await touchAfterMutation()
    return { ok: true, user }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not add player.' }
  }
}

export async function updatePlayer(
  userId: string,
  patch: Partial<Pick<User, 'name' | 'email' | 'handicap' | 'active'>>,
): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  try {
    const user = await apiRequestEntity<User>(`/api/v1/players/${userId}`, ['player', 'user'], {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    await touchAfterMutation()
    return { ok: true, user }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not update player.' }
  }
}

export async function removePlayerFromClub(
  clubId: string,
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await apiRequest<void>(`/api/v1/clubs/${clubId}/players/${userId}`, {
      method: 'DELETE',
    })
    await touchAfterMutation()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not remove player.' }
  }
}

export async function createTournament(input: {
  clubId: string
  name: string
  description: string
  startDate: string
  endDate: string
  entryLimit: number
  scoringFormat: ScoringFormat
  createdByUserId: string
}): Promise<{ ok: true; tournament: Tournament } | { ok: false; error: string }> {
  try {
    const tournament = await apiRequestEntity<Tournament>('/api/v1/tournaments', ['tournament'], {
      method: 'POST',
      body: JSON.stringify(input),
    })
    await touchAfterMutation()
    return { ok: true, tournament }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not create tournament.' }
  }
}

export async function updateTournament(
  tournamentId: string,
  patch: Partial<
    Pick<
      Tournament,
      'name' | 'description' | 'startDate' | 'endDate' | 'entryLimit' | 'scoringFormat'
    >
  >,
): Promise<{ ok: true; tournament: Tournament } | { ok: false; error: string }> {
  try {
    const tournament = await apiRequestEntity<Tournament>(`/api/v1/tournaments/${tournamentId}`, ['tournament'], {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    await touchAfterMutation()
    return { ok: true, tournament }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not update tournament.' }
  }
}

export async function publishTournamentLive(
  tournamentId: string,
): Promise<{ ok: true; tournament: Tournament } | { ok: false; error: string }> {
  try {
    const tournament = await apiRequestEntity<Tournament>(`/api/v1/tournaments/${tournamentId}/publish`, ['tournament'], {
      method: 'POST',
    })
    await touchAfterMutation()
    return { ok: true, tournament }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not publish tournament.' }
  }
}

export async function closeTournament(
  tournamentId: string,
): Promise<{ ok: true; tournament: Tournament } | { ok: false; error: string }> {
  try {
    const tournament = await apiRequestEntity<Tournament>(`/api/v1/tournaments/${tournamentId}/close`, ['tournament'], {
      method: 'POST',
    })
    await touchAfterMutation()
    return { ok: true, tournament }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not close tournament.' }
  }
}

export async function sendInvitation(input: {
  clubId: string
  email: string
  invitedByUserId: string
}): Promise<{ ok: true; invitation: Invitation } | { ok: false; error: string }> {
  try {
    const invitation = await apiRequestEntity<Invitation>('/api/v1/invitations', ['invitation'], {
      method: 'POST',
      body: JSON.stringify(input),
    })
    await touchAfterMutation()
    return { ok: true, invitation }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not send invitation.' }
  }
}

export async function acceptInvitation(
  invitationId: string,
  _playerUserId: string,
): Promise<{ ok: true; invitation: Invitation } | { ok: false; error: string }> {
  try {
    const invitation = await apiRequestEntity<Invitation>(`/api/v1/invitations/${invitationId}/accept`, ['invitation'], {
      method: 'POST',
    })
    await touchAfterMutation()
    return { ok: true, invitation }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not accept invitation.' }
  }
}

export async function declineInvitation(
  invitationId: string,
): Promise<{ ok: true; invitation: Invitation } | { ok: false; error: string }> {
  try {
    const invitation = await apiRequestEntity<Invitation>(`/api/v1/invitations/${invitationId}/decline`, ['invitation'], {
      method: 'POST',
    })
    await touchAfterMutation()
    return { ok: true, invitation }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not decline invitation.' }
  }
}

export async function submitJoinRequest(input: {
  clubId: string
  playerUserId: string
  message?: string
}): Promise<{ ok: true; request: JoinRequest } | { ok: false; error: string }> {
  try {
    const request = await apiRequestEntity<JoinRequest>('/api/v1/join-requests', ['joinRequest', 'request'], {
      method: 'POST',
      body: JSON.stringify(input),
    })
    await touchAfterMutation()
    return { ok: true, request }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not submit join request.' }
  }
}

export async function approveJoinRequest(
  requestId: string,
  _reviewedByUserId: string,
): Promise<{ ok: true; request: JoinRequest } | { ok: false; error: string }> {
  try {
    const request = await apiRequestEntity<JoinRequest>(`/api/v1/join-requests/${requestId}/approve`, ['joinRequest', 'request'], {
      method: 'POST',
    })
    await touchAfterMutation()
    return { ok: true, request }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not approve request.' }
  }
}

export async function rejectJoinRequest(
  requestId: string,
  _reviewedByUserId: string,
): Promise<{ ok: true; request: JoinRequest } | { ok: false; error: string }> {
  try {
    const request = await apiRequestEntity<JoinRequest>(`/api/v1/join-requests/${requestId}/reject`, ['joinRequest', 'request'], {
      method: 'POST',
    })
    await touchAfterMutation()
    return { ok: true, request }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not reject request.' }
  }
}

export async function registerForTournament(input: {
  tournamentId: string
  userId: string
}): Promise<{ ok: true; registration: TournamentRegistration } | { ok: false; error: string }> {
  try {
    const registration = await apiRequestEntity<TournamentRegistration>(
      `/api/v1/tournaments/${input.tournamentId}/registrations`,
      ['registration'],
      {
        method: 'POST',
        body: JSON.stringify({ userId: input.userId }),
      },
    )
    await touchAfterMutation()
    return { ok: true, registration }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not register.' }
  }
}
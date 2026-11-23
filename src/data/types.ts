export type Role = 'super_admin' | 'club_admin' | 'player'

export type TournamentStatus = 'draft' | 'live' | 'closed'

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired'

export type JoinRequestStatus = 'pending' | 'approved' | 'rejected'

export type ScoringFormat = 'stroke' | 'stableford' | 'match_play' | 'scramble'

export interface User {
  id: string
  name: string
  email: string
  /** Set only for local forms; the API never returns a password. */
  password?: string
  role: Role
  active: boolean
  /** Primary club for club_admin accounts. */
  clubId?: string
  handicap?: number
  createdAt: string
}

export interface Club {
  id: string
  name: string
  city: string
  state: string
  holes: number
  description: string
  adminUserId?: string
  active: boolean
  createdAt: string
}

export interface Tournament {
  id: string
  clubId: string
  name: string
  description: string
  startDate: string
  endDate: string
  entryLimit: number
  scoringFormat: ScoringFormat
  status: TournamentStatus
  createdByUserId: string
  createdAt: string
  updatedAt: string
}

export interface Invitation {
  id: string
  clubId: string
  email: string
  invitedByUserId: string
  status: InvitationStatus
  createdAt: string
  expiresAt: string
}

export interface JoinRequest {
  id: string
  clubId: string
  playerUserId: string
  message: string
  status: JoinRequestStatus
  createdAt: string
  reviewedAt?: string
  reviewedByUserId?: string
}

export interface ClubMembership {
  id: string
  clubId: string
  userId: string
  active: boolean
  joinedAt: string
}

export interface Session {
  userId: string
  signedInAt: string
}

export interface TournamentRegistration {
  id: string
  tournamentId: string
  userId: string
  registeredAt: string
}

export interface AppState {
  users: User[]
  clubs: Club[]
  tournaments: Tournament[]
  invitations: Invitation[]
  joinRequests: JoinRequest[]
  memberships: ClubMembership[]
  registrations: TournamentRegistration[]
  session: Session | null
}

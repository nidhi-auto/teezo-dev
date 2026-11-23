function toIso(value) {
  if (!value) {
    return undefined;
  }
  const d = value instanceof Date ? value : new Date(value);
  return d.toISOString();
}

function toDateString(value) {
  if (!value) {
    return '';
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const d = value instanceof Date ? value : new Date(value);
  return d.toISOString().slice(0, 10);
}

export function mapUser(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    active: row.active,
    clubId: row.club_id ?? undefined,
    handicap: row.handicap != null ? Number(row.handicap) : undefined,
    createdAt: toIso(row.created_at),
  };
}

export function mapClub(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    state: row.state,
    holes: row.holes,
    description: row.description,
    adminUserId: row.admin_user_id ?? undefined,
    active: row.active,
    createdAt: toIso(row.created_at),
  };
}

export function mapTournament(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    clubId: row.club_id,
    name: row.name,
    description: row.description,
    startDate: toDateString(row.start_date),
    endDate: toDateString(row.end_date),
    entryLimit: row.entry_limit,
    scoringFormat: row.scoring_format,
    status: row.status,
    createdByUserId: row.created_by_user_id,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export function mapInvitation(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    clubId: row.club_id,
    email: row.email,
    invitedByUserId: row.invited_by_user_id,
    status: row.status,
    createdAt: toIso(row.created_at),
    expiresAt: toIso(row.expires_at),
  };
}

export function mapJoinRequest(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    clubId: row.club_id,
    playerUserId: row.player_user_id,
    message: row.message,
    status: row.status,
    createdAt: toIso(row.created_at),
    reviewedAt: row.reviewed_at ? toIso(row.reviewed_at) : undefined,
    reviewedByUserId: row.reviewed_by_user_id ?? undefined,
  };
}

export function mapSettings(row) {
  if (!row) {
    return {
      emailNotifications: true,
      tournamentAlerts: true,
    };
  }
  return {
    emailNotifications: row.email_notifications,
    tournamentAlerts: row.tournament_alerts,
  };
}
export function mapMembership(row) {
  if (!row) return null;
  return {
    id: row.id,
    clubId: row.club_id,
    userId: row.user_id,
    active: row.active,
    joinedAt: toIso(row.joined_at),
  };
}

export function mapRegistration(row) {
  if (!row) return null;
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    userId: row.user_id,
    registeredAt: toIso(row.registered_at),
  };
}

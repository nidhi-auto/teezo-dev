import { query } from '../utils/db.js';
import { mapSettings } from '../utils/mappers.js';

export async function getSettings(userId) {
  const { rows } = await query('SELECT * FROM user_settings WHERE user_id = $1', [userId]);
  return mapSettings(rows[0]);
}

export async function upsertSettings(userId, { emailNotifications, tournamentAlerts }) {
  const { rows } = await query(
    `INSERT INTO user_settings (user_id, email_notifications, tournament_alerts, updated_at)
     VALUES ($1, COALESCE($2, true), COALESCE($3, true), now())
     ON CONFLICT (user_id) DO UPDATE SET
       email_notifications = COALESCE($2, user_settings.email_notifications),
       tournament_alerts = COALESCE($3, user_settings.tournament_alerts),
       updated_at = now()
     RETURNING *`,
    [userId, emailNotifications, tournamentAlerts],
  );
  return mapSettings(rows[0]);
}
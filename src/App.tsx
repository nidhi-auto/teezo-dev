import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/shell/AppShell'
import { RequireAuth } from '@/components/shell/RequireAuth'
import { LandingPage } from '@/pages/marketing/LandingPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { AuthCallbackPage } from '@/pages/auth/AuthCallbackPage'
import { HomePage } from '@/pages/HomePage'
import { ClubAdminsPage } from '@/pages/super-admin/ClubAdminsPage'
import { ClubsPage } from '@/pages/super-admin/ClubsPage'
import { PlayersPage } from '@/pages/PlayersPage'
import { InvitationsPage } from '@/pages/club-admin/InvitationsPage'
import { JoinRequestsPage } from '@/pages/club-admin/JoinRequestsPage'
import { TournamentsPage } from '@/pages/TournamentsPage'
import { TournamentDetailPage } from '@/pages/TournamentDetailPage'
import { BrowseClubsPage } from '@/pages/player/BrowseClubsPage'
import { MyClubsPage } from '@/pages/player/MyClubsPage'
import { MyInvitesPage } from '@/pages/player/MyInvitesPage'
import { MyRequestsPage } from '@/pages/player/MyRequestsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { MobilePlayerApp } from '@/pages/player/MobilePlayerApp'
import { NotFoundPage } from '@/pages/NotFoundPage'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<HomePage />} />
          <Route
            path="club-admins"
            element={
              <RequireAuth roles={['super_admin']}>
                <ClubAdminsPage />
              </RequireAuth>
            }
          />
          <Route
            path="clubs"
            element={
              <RequireAuth roles={['super_admin']}>
                <ClubsPage />
              </RequireAuth>
            }
          />
          <Route path="players" element={<PlayersPage />} />
          <Route
            path="invitations"
            element={
              <RequireAuth roles={['club_admin']}>
                <InvitationsPage />
              </RequireAuth>
            }
          />
          <Route
            path="join-requests"
            element={
              <RequireAuth roles={['club_admin']}>
                <JoinRequestsPage />
              </RequireAuth>
            }
          />
          <Route path="tournaments" element={<TournamentsPage />} />
          <Route path="tournaments/:id" element={<TournamentDetailPage />} />
          <Route
            path="browse"
            element={
              <RequireAuth roles={['player']}>
                <BrowseClubsPage />
              </RequireAuth>
            }
          />
          <Route
            path="my-clubs"
            element={
              <RequireAuth roles={['player']}>
                <MyClubsPage />
              </RequireAuth>
            }
          />
          <Route
            path="my-invites"
            element={
              <RequireAuth roles={['player']}>
                <MyInvitesPage />
              </RequireAuth>
            }
          />
          <Route
            path="my-requests"
            element={
              <RequireAuth roles={['player']}>
                <MyRequestsPage />
              </RequireAuth>
            }
          />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route
          path="/m"
          element={
            <RequireAuth roles={['player']}>
              <MobilePlayerApp />
            </RequireAuth>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

import { useEffect } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/cn';
import logoMark from '@/assets/logos/teezo-mark.svg';
import iconClubs from '@/assets/icons/nav-clubs.svg';
import iconTournaments from '@/assets/icons/nav-tournaments.svg';
import iconPlayers from '@/assets/icons/nav-players.svg';
import iconRequests from '@/assets/icons/nav-requests.svg';
import { Button } from '@/components/ui/Button';
import { getState, hydrate } from '@/data/store';

type NavItem = { to: string; label: string; icon?: string };

function roleNav(role: string | null, clubId?: string): NavItem[] {
  if (role === 'super_admin') {
    return [
      { to: '/app', label: 'Overview', icon: iconClubs },
      { to: '/app/club-admins', label: 'Club Admins', icon: iconPlayers },
      { to: '/app/clubs', label: 'Clubs', icon: iconClubs },
      { to: '/app/players', label: 'All Players', icon: iconPlayers },
      { to: '/app/tournaments', label: 'All Tournaments', icon: iconTournaments },
      { to: '/app/settings', label: 'Settings' },
    ];
  }
  if (role === 'club_admin') {
    return [
      { to: '/app', label: 'Club Home', icon: iconClubs },
      { to: '/app/players', label: 'Players', icon: iconPlayers },
      { to: '/app/invitations', label: 'Invitations', icon: iconRequests },
      { to: '/app/join-requests', label: 'Join Requests', icon: iconRequests },
      { to: '/app/tournaments', label: 'Tournaments', icon: iconTournaments },
      { to: '/app/settings', label: 'Settings' },
    ];
  }
  return [
    { to: '/app', label: 'Home', icon: iconClubs },
    { to: '/app/browse', label: 'Browse Clubs', icon: iconClubs },
    { to: '/app/my-clubs', label: 'My Clubs', icon: iconClubs },
    { to: '/app/my-invites', label: 'Invitations', icon: iconRequests },
    { to: '/app/my-requests', label: 'My Requests', icon: iconRequests },
    { to: '/m', label: 'Mobile View' },
    { to: '/app/settings', label: 'Settings' },
  ];
}

export function AppShell() {
  const { user, role, signOut } = useAuth();

  useEffect(() => {
    if (user) {
      void hydrate();
    }
  }, [user]);

  const club =
    role === 'club_admin' && user?.clubId
      ? getState().clubs.find((c) => c.id === user.clubId)
      : undefined;
  const items = roleNav(role, user?.clubId);

  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="sticky top-0 flex h-dvh w-60 shrink-0 flex-col border-r border-border bg-sidebar">
        <Link to="/app" className="flex items-center gap-2.5 px-4 py-5">
          <img src={logoMark} alt="" className="h-9 w-9" />
          <div>
            <div className="font-display text-base font-semibold text-foreground">Teezo</div>
            <div className="text-[11px] text-muted-foreground">
              {role === 'super_admin'
                ? 'Super Admin'
                : role === 'club_admin'
                  ? club?.name ?? 'Club Admin'
                  : 'Player'}
            </div>
          </div>
        </Link>
        <nav className="flex flex-1 flex-col gap-0.5 px-2 pb-4">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/app'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors',
                  isActive ? 'bg-sidebar-active text-foreground' : 'hover:bg-muted',
                )
              }
            >
              {item.icon ? (
                <img src={item.icon} alt="" className="h-4 w-4 opacity-80" />
              ) : (
                <span className="h-4 w-4" />
              )}
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <div className="mb-2 truncate px-1 text-xs text-muted-foreground">{user?.email}</div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() => void signOut()}
          >
            Sign out
          </Button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

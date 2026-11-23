import { Link } from 'react-router-dom'
import logoMark from '@/assets/logos/teezo-mark.svg'
import heroFairway from '@/assets/illustrations/hero-fairway.svg'
import { Button } from '@/components/ui/Button'

export function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logoMark} alt="Teezo" className="h-9 w-9" />
          <span className="font-display text-lg font-semibold tracking-tight">Teezo</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button type="button" variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link to="/register">
            <Button type="button" size="sm">
              Join Teezo
            </Button>
          </Link>
        </div>
      </header>

      <section className="relative min-h-[92dvh] overflow-hidden">
        <img
          src={heroFairway}
          alt="Fairway stretching toward the pin at dusk"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[color-mix(in_oklch,var(--foreground)_58%,transparent)]" />
        <div className="relative z-[1] flex min-h-[92dvh] flex-col justify-end px-6 pb-16 pt-28 md:px-10 md:pb-20">
          <div className="max-w-2xl animate-fade-up space-y-5 text-background">
            <img src={logoMark} alt="" className="h-14 w-14 drop-shadow-md" />
            <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl">
              Teezo
            </h1>
            <p className="max-w-xl text-lg text-background/90 md:text-xl">
              Run clubs, seat members, and publish live tournaments from one clubhouse sheet.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link to="/login">
                <Button type="button" size="lg">
                  Sign in
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button
                  type="button"
                  size="lg"
                  variant="secondary"
                  className="border-0 bg-background/20 text-background hover:bg-background/30"
                >
                  How it works
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-t border-border bg-surface px-6 py-20 md:px-10">
        <div className="mx-auto max-w-5xl">
          <h2 className="max-w-xl font-display text-3xl font-semibold tracking-tight">
            Three roles. One fairway of truth.
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Super Admins provision the network. Club Admins run the day. Players find live fields —
            desktop or the Teezo mobile shell.
          </p>

          <div className="mt-14 grid gap-12 lg:grid-cols-12 lg:gap-10">
            <article className="lg:col-span-5">
              <h3 className="font-display text-2xl font-semibold">
                <span className="text-primary">Super Admin</span> — spin up the network
              </h3>
              <p className="mt-3 text-muted-foreground">
                Provision club admins, keep every course visible, and see which tournaments are live
                across the portfolio — without living in a spreadsheet.
              </p>
            </article>

            <article className="rounded-[var(--radius-lg)] border border-border bg-surface-elevated p-8 shadow-sm lg:col-span-7 lg:mt-8">
              <h3 className="font-display text-xl font-semibold">
                <span className="text-accent">Club Admin</span> — run the clubhouse day
              </h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Invite players, approve join requests, draft events, then Publish Live when the field
                is ready. Close when the last group walks off 18.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-foreground">
                <li className="flex gap-2">
                  <span className="text-primary" aria-hidden>
                    →
                  </span>{' '}
                  Roster + invitations
                </li>
                <li className="flex gap-2">
                  <span className="text-primary" aria-hidden>
                    →
                  </span>{' '}
                  Live Fairway Board on tournament day
                </li>
              </ul>
            </article>

            <article className="lg:col-span-12 lg:flex lg:items-end lg:justify-between lg:gap-10 lg:border-t lg:border-border lg:pt-8">
              <div className="max-w-xl">
                <h3 className="font-display text-xl font-semibold">
                  Player — find a club, join a field
                </h3>
                <p className="mt-3 text-muted-foreground">
                  Browse clubs with live events, accept invites, track join requests, and register
                  when you are a member — desktop or phone-width mobile shell.
                </p>
              </div>
              <Link to="/register" className="mt-6 inline-block shrink-0 lg:mt-0">
                <Button type="button" variant="accent">
                  Create a player account
                </Button>
              </Link>
            </article>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8 text-sm text-muted-foreground md:px-10">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <span>© Teezo — clubhouse operations for golf</span>
          <Link to="/login" className="font-medium text-foreground hover:underline">
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  )
}

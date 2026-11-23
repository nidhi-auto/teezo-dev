# Teezo

Golf clubhouse operations — clubs, tournaments, and players with Super Admin, Club Admin, and Player roles.

## Preview (mock-only)

```bash
npm install
npm run dev
```

Demo sign-in (`/login`):

| Email | Password | Role |
|---|---|---|
| `admin@example.com` | `password123` | Super Admin |
| `manager@example.com` | `password123` | Club Admin (Cedar Ridge GC) |
| `user@example.com` | `password123` | Player |

No real APIs or OAuth — in-memory store with `DUMMY:` markers for backend lock.

## Stack

Vite · React 19 · TypeScript · Tailwind CSS v4 · React Router 7

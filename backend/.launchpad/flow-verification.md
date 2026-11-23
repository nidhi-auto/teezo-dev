# Flow verification — Teezo R1

Every REQ-001..REQ-080 is in journey requirementIds.

- uiStack: web
- frontendVerifyCommand: `npm run build`
- Auth: register/login/forgot-password → 400 when Cognito unset

Vite tooling via .npmrc omit=optional; auth unset → 400.

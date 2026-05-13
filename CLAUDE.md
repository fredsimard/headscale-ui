# Headscale UI

Web UI for managing a Headscale v0.28.0 instance via its REST API. Runs as a Docker container alongside Headscale.

## Tech Stack

- Node.js with Express 4, EJS templates, Bootstrap 5 (CDN)
- No frontend framework — server-side rendered pages
- bcryptjs for password hashing (pure JS, no native deps)
- In-memory sessions via express-session
- All Headscale API calls are server-side (API key never reaches the browser)

## Project Layout

```
app.js                 # Express entry point: middleware, session, routing
headscale-api.js       # Headscale REST API client (callback-style, uses http module)
hash-password.js       # CLI: node hash-password.js <password> → bcrypt hash
middleware/auth.js     # Session auth guard
routes/auth.js         # Login/logout with in-memory rate limiter
routes/devices.js      # Nodes: list, rename, delete, register by node key
routes/users.js        # Users: list, create, delete
routes/preauth.js      # Pre-auth keys: list, create, expire (per user)
views/                 # EJS templates (partials/header.ejs has the navbar)
public/css/style.css   # Minimal custom styles on top of Bootstrap
```

## Running Locally

```bash
npm install
cp .env.example .env   # then edit with your Headscale URL, API key, and a password hash
node app.js            # or: npm run dev (uses --watch, requires Node 18+)
```

Login with the `ADMIN_USERNAME` / password matching `ADMIN_PASSWORD_HASH` from `.env`.

## Docker

```bash
docker compose up -d --build
```

The `docker-compose.yml` includes three services: `headscale`, `caddy`, and `headscale-ui`. Only modify the `headscale-ui` service. Caddy reverse-proxies the UI — see `Caddyfile.example`.

## Key Design Decisions

- Callback-style code (no async/await) for broad Node.js compatibility; Docker uses Node 22
- Security headers set inline in app.js instead of helmet (avoids native dep issues)
- Rate limiter for login is a simple in-memory counter instead of express-rate-limit
- No database — session state is in-memory (restart clears sessions, fine for single admin)
- Environment config via dotenv: `HEADSCALE_URL`, `HEADSCALE_API_KEY`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`

## Headscale API

All calls go through `headscale-api.js`. The API client uses Node's built-in `http`/`https` modules with callbacks. Errors from unreachable Headscale are caught and shown as alerts in the UI rather than crashing the app.

API base path: `/api/v1` (Headscale v0.28.0).

## Testing

No test suite. Verify manually:
1. Login page renders at `/login`
2. Bad credentials show "Invalid credentials"
3. Authenticated pages show Headscale data or a clear connection error
4. Unauthenticated requests redirect to `/login`

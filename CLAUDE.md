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
routes/users.js        # Users: list, create, rename, delete
routes/preauth.js      # Pre-auth keys: list, create, expire (per user)
routes/prefs.js        # User preferences: timezone, date/time format, Headscale FQDN
views/                 # EJS templates (partials/header.ejs has the navbar)
public/css/style.css   # Ollama-inspired minimal design system
public/js/main.js      # Client-side: clipboard, sorting, search, status filter, modals
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
- User preferences (timezone, date format, Headscale FQDN) stored in session — survive page navigations but clear on restart
- Policy detection cached for 60s via `GET /api/v1/policy` — shown as a flag in the footer

## Headscale API

All calls go through `headscale-api.js`. The API client uses Node's built-in `http`/`https` modules with callbacks. Errors from unreachable Headscale are caught and shown as alerts in the UI rather than crashing the app.

API base path: `/api/v1` (Headscale v0.28.0).

Endpoints used:
- `GET /node` — list all nodes (includes `forcedTags`, `validTags` for tag display)
- `POST /node/:id/rename/:name` — rename a node
- `DELETE /node/:id` — delete a node
- `POST /node/register` — register by node key
- `GET /user` — list users
- `POST /user` — create user
- `POST /user/:id/rename/:name` — rename user
- `DELETE /user/:id` — delete user
- `GET /preauthkey` — list pre-auth keys per user
- `POST /preauthkey` — create pre-auth key
- `POST /preauthkey/expire` — expire a key
- `GET /policy` — fetch ACL policy (for footer flag)

## Testing

No test suite. Verify manually:
1. Login page renders at `/login`
2. Bad credentials show "Invalid credentials"
3. Authenticated pages show Headscale data or a clear connection error
4. Unauthenticated requests redirect to `/login`
5. Search boxes on Devices and Users filter in real time across all columns
6. Devices show P (personal) or T (tagged) badge next to the ID
7. Tags column displays and is searchable/sortable
8. Footer shows ACL policy active/inactive flag
9. Preferences page lets you set timezone, date format, and Headscale public FQDN

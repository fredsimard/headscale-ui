# Headscale UI

A lightweight web interface for managing a [Headscale](https://github.com/juanfont/headscale) instance via its REST API. Runs as a separate Docker container alongside your existing Headscale setup.

## Features

- **Devices** — list, rename, delete nodes; register new devices by node key
- **Users** — list, create, delete Headscale users
- **Pre-Auth Keys** — create (reusable, ephemeral, custom expiry), list, and expire keys per user
- Bootstrap 5 UI with responsive tables and card layouts
- Session-based admin login with bcrypt and rate limiting
- All Headscale API calls are server-side — the API key never reaches the browser

## Setup

### 1. Generate a Headscale API key

On your Headscale server:

```bash
docker exec headscale headscale apikeys create --expiration 365d
```

Copy the returned key.

### 2. Create the `.env` file

```bash
cp .env.example .env
```

Edit `.env` and fill in:

| Variable | Description |
|---|---|
| `HEADSCALE_URL` | Internal URL of Headscale (e.g., `http://headscale:8080`) |
| `HEADSCALE_API_KEY` | The API key from step 1 |
| `ADMIN_USERNAME` | Login username (default: `admin`) |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of your password (see below) |
| `SESSION_SECRET` | A long random string for session signing |

### 3. Generate the password hash

```bash
# Install dependencies first
npm install

# Generate the hash
node hash-password.js 'your-secure-password'
```

Paste the output into `ADMIN_PASSWORD_HASH` in your `.env` file.

### 4. Configure Caddy (optional)

Add the snippet from `Caddyfile.example` to your Caddy configuration, replacing the domain with yours.

### 5. Deploy

```bash
docker compose up -d --build
```

The UI will be available on port 3000 internally (or through Caddy on your configured domain).

## Development

```bash
npm install
cp .env.example .env
# Edit .env with your local Headscale details and a password hash
npm run dev
```

The dev server uses `--watch` for auto-reload on file changes.

## Architecture

```
Browser → Caddy (TLS) → headscale-ui:3000 (Express/EJS)
                                ↓
                         headscale:8080 (API)
```

- The UI app makes server-side HTTP calls to the Headscale API
- Authentication is handled by the UI app itself (separate from Headscale)
- Session data is stored in-memory (restarts clear sessions)

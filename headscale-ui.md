# Headscale Management UI — Claude Code Prompt

Build a Node.js web application to manage a Headscale instance (v0.28.0) via its REST API. The app will run as a separate Docker container alongside the existing Headscale container.

## Project Structure

- Docker Compose project with two services: the existing `headscale` container (untouched) and the new `headscale-ui` Node.js app
- The UI container communicates with Headscale internally via Docker network using its API key
- No modifications to Headscale whatsoever — it only receives standard REST API calls

## Tech Stack

- Node.js with Express
- Server-side rendered with EJS or similar (no heavyweight frontend framework needed)
- Session-based authentication with bcrypt password hashing
- SQLite or a simple JSON file for storing the UI's own credentials (separate from Headscale's database)

## Authentication

- Single admin user login (username + password)
- Secure session management (express-session with a strong secret)
- All routes protected behind auth middleware
- Credentials and Headscale API key stored in environment variables or a `.env` file
- Rate limiting on the login endpoint to prevent brute force

## Headscale Connectivity

- Headscale base URL and API key configurable via environment variables
- All API calls made server-side only — the API key is never exposed to the browser

## Features

### 1. Devices Page
List all nodes with columns: ID, Hostname, Name, MachineKey, NodeKey, User, IP addresses, Ephemeral, Last seen, Expiration, Connected, Expired.
Actions: rename, delete.

### 2. Users Page
List all users with columns: ID, name, username, email, created timestamp.
Actions: add user, delete user.

### 3. Register Device
Form to register a device by node key (the key generated on the device itself).

### 4. Pre-Auth Keys
Create pre-auth keys (with options: reusable, ephemeral, expiry) and list/revoke existing ones per user.

## UI

Use Bootstrap 5 for the UI — clean, responsive, well organised. Use a dark navbar, card-based layouts for each section, and styled tables for listing devices and users.

## Docker Setup

- `Dockerfile` for the Node.js app
- Updated `docker-compose.yml` that adds the new `headscale-ui` service alongside the existing `headscale` and `caddy` services
- The UI should be on the same Docker network as Headscale so it can reach it internally
- UI listens on port 3000 internally; Caddy proxies it externally
- Include a sample `Caddyfile` snippet for reverse proxying the UI

### Existing docker-compose.yml to extend

Add the new service to this — do not modify the `headscale` or `caddy` services:

```yaml
services:
  headscale:
    image: docker.io/headscale/headscale:0.28.0
    container_name: headscale
    ports:
      - "0.0.0.0:8080:8080"
      - "0.0.0.0:9090:9090"
    volumes:
      - /root/headscale/config:/etc/headscale
      - /root/headscale/lib:/var/lib/headscale
      - /root/headscale/run:/var/run/headscale
    healthcheck:
      test: ["CMD", "headscale", "health"]
    command: serve
    restart: unless-stopped
    dns:
      - 1.1.1.1
      - 8.8.8.8

  caddy:
    image: caddy:latest
    restart: unless-stopped
    container_name: caddy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config

volumes:
  caddy_data:
  caddy_config:
```

## Other Requirements

- Proper error handling — if Headscale is unreachable, show a clear error rather than crashing
- A `README.md` with setup instructions: how to generate a Headscale API key, configure the `.env` file, and deploy
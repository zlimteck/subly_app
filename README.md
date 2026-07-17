<div align="center">

![Subly Logo](https://zupimages.net/up/25/45/7734.png)

# Subly

**A modern subscription expense tracker with automated reminders and calendar integration**

[![Docker Hub](https://img.shields.io/docker/v/zlimteck/subly?label=Docker%20Hub&logo=docker)](https://hub.docker.com/r/zlimteck/subly)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[Features](#features) • [Quick Start](#quick-start) • [Screenshots](#screenshots) • [Documentation](#documentation)

</div>

---

## Features

- 📊 **Subscription Tracking** - Monthly and annual subscriptions with smart cost calculations
- 💳 **Credit / Installment Tracking** - Track car loans, 4x payments and any fixed-term recurring expense with automatic expiry
- 🎯 **Trial Management** - Monitor free trials with expiration alerts
- 📅 **Calendar Integration** - iCal subscription for Apple Calendar, Google Calendar, Outlook
- 🔔 **Smart Notifications** - Email and browser push notifications (configurable 1-7 days before)
- 📈 **Analytics** - Interactive charts by category and spending trends
- 🎨 **Multiple Themes** - Dark, Light, Dracula, Nord, Solarized
- 💱 **Multi-Currency** - EUR and USD with cross-device sync
- 🌐 **i18n** - English and French support
- 📱 **Responsive** - Works seamlessly on desktop, tablet, and mobile
- 🔐 **Secure** - JWT auth, bcrypt passwords, email verification, invitation system
- 🔑 **API Token** - Persistent non-expiring token for external integrations and scripts
- 🤖 **MCP Server** - Streamable HTTP MCP endpoint to control Subly via AI assistants (Claude, Cursor…)

## Quick Start

### Docker Compose (Recommended)

1. **Create a docker-compose.yml file:**
```yaml
services:
  mongodb:
    image: mongo:8.0
    container_name: subly-mongodb
    environment:
      - MONGO_INITDB_ROOT_USERNAME=subly_admin
      - MONGO_INITDB_ROOT_PASSWORD=change_this_password
      - MONGO_INITDB_DATABASE=subly
    volumes:
      - mongodb_data:/data/db
      - mongodb_config:/data/configdb
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5

  subly:
    image: zlimteck/subly:latest
    container_name: subly-app
    ports:
      - "3000:80"
      - "5071:5071"
    environment:
      - NODE_ENV=production
      - PORT=5071
      - MONGODB_URI=mongodb://subly_admin:change_this_password@mongodb:27017/subly?authSource=admin
      - JWT_SECRET=your_secure_random_string_here
      - FRONTEND_URL=http://your_ip_here:3000
      - BACKEND_URL=http://your_ip_here:5071
      - TZ=Europe/Paris
    depends_on:
      mongodb:
        condition: service_healthy
    restart: unless-stopped

volumes:
  mongodb_data:
    driver: local
  mongodb_config:
    driver: local
```

2. **Start the services:**
```bash
docker-compose up -d
```

3. **Generate an invitation code:**
```bash
docker exec -it subly-app node /app/backend/scripts/generateInvite.js
```

4. **Access the app:**
- Open http://localhost:3000
- Sign up with the invitation code
- Promote yourself to admin: `docker exec -it subly-app node /app/backend/scripts/promoteAdmin.js your-username`

**That's it!** 🎉

### Other Installation Methods

- **[Docker Hub Image](docs/DOCKER.md)** - Pull and run the pre-built image
- **[From Source](docs/DEVELOPMENT.md)** - Clone and run locally for development
- **[Manual Setup](docs/INSTALLATION.md)** - Detailed installation guide

## Screenshots

<details>
<summary>🖼️ View Screenshots</summary>

### Login Page
![Login Page](https://zupimages.net/up/25/45/froy.png)

### Dashboard - Terminal Dark Theme
![Dashboard Terminal Dark](https://zupimages.net/up/25/45/8nq2.png)

### Dashboard - Dracula Theme
![Dashboard Dracula](https://zupimages.net/up/25/45/9yxh.png)

### Dashboard - Nord Theme
![Dashboard Nord](https://zupimages.net/up/25/45/wm0o.png)

### Dashboard - Light Mode
![Dashboard Light](https://zupimages.net/up/25/45/7kg5.png)

### Profile Modal
![Profile Modal](https://zupimages.net/up/25/45/9t0n.png)

</details>

## Tech Stack

**Frontend:** React 18, Vite, React Router, Recharts, Axios, date-fns, Lucide Icons

**Backend:** Node.js, Express, MongoDB, Mongoose, JWT, bcrypt, Resend (email), web-push, MCP SDK

**DevOps:** Docker, Docker Compose, Nginx, GitHub Actions

## Documentation

- 📖 **[Installation Guide](docs/INSTALLATION.md)** - Detailed setup instructions
- 🐳 **[Docker Guide](docs/DOCKER.md)** - Docker deployment options
- 💻 **[Development Guide](docs/DEVELOPMENT.md)** - Local development setup
- ⚙️ **[Configuration](docs/CONFIGURATION.md)** - Environment variables reference
- 🔌 **[API Documentation](docs/API.md)** - REST API endpoints
- 🤖 **[MCP Server](#mcp-server)** - AI assistant integration
- 🏗️ **[Architecture](CLAUDE.md)** - Project structure and design

## MCP Server

Subly exposes a [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server over Streamable HTTP, allowing AI assistants (Claude Desktop, Cursor, etc.) to read and manage your subscriptions directly.

**Endpoint:** `POST http://<your-host>:5071/mcp`

**Authentication:** Pass your Subly **API Token** (or JWT) as a Bearer token in the `Authorization` header. The API Token is recommended — it never expires and can be found in your Profile settings.

### Available tools

| Tool | Description |
|------|-------------|
| `list_subscriptions` | List subscriptions (optional filters: `activeOnly`, `category`) |
| `get_stats` | Monthly/yearly totals and spending by category |
| `list_categories` | List all user categories |
| `create_subscription` | Create a new subscription |
| `update_subscription` | Update an existing subscription by ID |
| `delete_subscription` | Delete a subscription by ID |

### Claude Desktop configuration

Claude Desktop does not support Streamable HTTP natively. Use [`mcp-remote`](https://www.npmjs.com/package/mcp-remote) as a stdio bridge — no extra install required (`npx` handles it).

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "subly": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://localhost:5071/mcp",
        "--header",
        "Authorization:Bearer <your_api_token>"
      ]
    }
  }
}
```

> **Tip:** Get your API Token from **Profile → API Token** in the Subly web app. It never expires, unlike the JWT session token.

### Other compatible clients

Clients that support Streamable HTTP natively (Cursor, etc.) can connect directly:

```json
{
  "mcpServers": {
    "subly": {
      "type": "http",
      "url": "http://localhost:5071/mcp",
      "headers": {
        "Authorization": "Bearer <your_api_token>"
      }
    }
  }
}
```

## Quick Links

- 🐛 [Report a Bug](https://github.com/zlimteck/subly_app/issues)
- 💡 [Request a Feature](https://github.com/zlimteck/subly_app/issues)
- 🐳 [Docker Hub](https://hub.docker.com/r/zlimteck/subly)
- 📦 [Latest Release](https://github.com/zlimteck/subly_app/releases)

## License

MIT License - See [LICENSE](LICENSE) for details

---

<div align="center">
Built with ❤️ using Node.js, React, and MongoDB
</div>

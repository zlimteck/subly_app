# Configuration Reference

Complete reference for all environment variables used in Subly.

## Table of Contents

- [Environment Variables Overview](#environment-variables-overview)
- [Backend Configuration](#backend-configuration)
- [Frontend Configuration](#frontend-configuration)
- [Database Configuration](#database-configuration)
- [Authentication & Security](#authentication--security)
- [Email Service](#email-service)
- [Push Notifications](#push-notifications)
- [URLs & CORS](#urls--cors)
- [Timezone Configuration](#timezone-configuration)
- [Examples](#examples)
- [Security Best Practices](#security-best-practices)

## Environment Variables Overview

Subly uses environment variables for configuration. These can be set in:
- `.env` file (development)
- `docker-compose.yml` (Docker deployment)
- System environment variables (production)

### Quick Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5071` | Backend server port |
| `NODE_ENV` | No | `development` | Node environment |
| `MONGODB_URI` | **Yes** | - | MongoDB connection string |
| `JWT_SECRET` | **Yes** | - | JWT token secret |
| `FRONTEND_URL` | **Yes** | - | Frontend URL for CORS |
| `BACKEND_URL` | **Yes** | - | Backend URL for calendar links |
| `VITE_API_URL` | **Yes** | - | API URL for frontend |
| `RESEND_API_KEY` | No | - | Resend API key for emails |
| `EMAIL_FROM` | No | - | Email sender address |
| `VAPID_PUBLIC_KEY` | No | - | VAPID public key for push |
| `VAPID_PRIVATE_KEY` | No | - | VAPID private key for push |
| `VAPID_SUBJECT` | No | - | VAPID subject (email) |
| `TZ` | No | `UTC` | Timezone for cron jobs |

## Backend Configuration

### PORT

**Required:** No
**Default:** `5071`
**Description:** Port number for the backend API server

```bash
PORT=5071
```

**Notes:**
- Must be different from frontend port (5173)
- Must be available and not in use
- Update `BACKEND_URL` if changed

### NODE_ENV

**Required:** No
**Default:** `development`
**Values:** `development`, `production`, `test`
**Description:** Node.js environment mode

```bash
NODE_ENV=production
```

**Effects:**
- `development`: Verbose logging, hot reload
- `production`: Optimized performance, minimal logging
- `test`: Testing configuration

## Frontend Configuration

### VITE_API_URL

**Required:** Yes (for frontend)
**Default:** -
**Description:** Backend API URL for frontend requests

```bash
VITE_API_URL=http://localhost:5071
```

**Production example:**
```bash
VITE_API_URL=https://api.yourdomain.com
```

**Notes:**
- Must match backend URL
- Used by Axios in frontend
- Include protocol (http/https)
- No trailing slash

## Database Configuration

### MONGODB_URI

**Required:** Yes
**Default:** -
**Description:** MongoDB connection string

**MongoDB Atlas (recommended):**
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/subly?retryWrites=true&w=majority
```

**Local MongoDB:**
```bash
MONGODB_URI=mongodb://localhost:27017/subly
```

**Local MongoDB with auth:**
```bash
MONGODB_URI=mongodb://admin:password@localhost:27017/subly?authSource=admin
```

**Docker MongoDB:**
```bash
MONGODB_URI=mongodb://subly_admin:password@mongodb:27017/subly?authSource=admin
```

**Format:**
```
mongodb[+srv]://[username:password@]host[:port]/database[?options]
```

**Important:**
- Replace `username`, `password`, `host`, and `database`
- URL encode special characters in password
- Use `mongodb+srv://` for Atlas
- Use `mongodb://` for local/self-hosted

### MongoDB Atlas Setup

1. Create free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create database user
3. Whitelist IP addresses
4. Get connection string
5. Replace `<password>` with your password
6. Replace `myFirstDatabase` with `subly`

## Authentication & Security

### JWT_SECRET

**Required:** Yes
**Default:** -
**Description:** Secret key for signing JWT tokens

```bash
JWT_SECRET=your_secure_random_string_here_minimum_32_characters
```

**Generate secure secret:**

```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 3: Online
# Visit https://randomkeygen.com/
```

**Requirements:**
- Minimum 32 characters
- Random and unpredictable
- Keep secret and never commit to git
- Different for each environment (dev/staging/prod)

**Security:**
- Change if compromised
- Store securely (environment variables, secrets manager)
- Never log or expose

## Email Service

Subly uses [Resend](https://resend.com) for transactional emails.

### RESEND_API_KEY

**Required:** No (optional feature)
**Default:** -
**Description:** API key from Resend

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
```

**Get API key:**
1. Sign up at [resend.com](https://resend.com)
2. Go to API Keys section
3. Create new API key
4. Copy key (starts with `re_`)

**Free tier:**
- 3,000 emails/month
- 100 emails/day

### EMAIL_FROM

**Required:** No (required if using email)
**Default:** -
**Description:** Sender email address

```bash
EMAIL_FROM=noreply@yourdomain.com
```

**Requirements:**
- Must be verified in Resend
- Use your own domain (recommended)
- Or use Resend test domain

**Email types sent:**
- Registration verification
- Welcome emails
- Trial expiration alerts
- Subscription renewal reminders

## Push Notifications

Web push notifications for payment reminders.

### VAPID_PUBLIC_KEY

**Required:** No (optional feature)
**Default:** -
**Description:** VAPID public key for web push

```bash
VAPID_PUBLIC_KEY=BNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### VAPID_PRIVATE_KEY

**Required:** No (required if using push)
**Default:** -
**Description:** VAPID private key for web push

```bash
VAPID_PRIVATE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### VAPID_SUBJECT

**Required:** No (required if using push)
**Default:** -
**Description:** VAPID subject (contact email or URL)

```bash
VAPID_SUBJECT=mailto:admin@yourdomain.com
```

**Or:**
```bash
VAPID_SUBJECT=https://yourdomain.com
```

### Generate VAPID Keys

**From source:**
```bash
node backend/scripts/generateVapidKeys.js
```

**From Docker:**
```bash
docker exec -it subly-app node /app/backend/scripts/generateVapidKeys.js
```

**Output:**
```
VAPID Keys Generated:
====================
Public Key: BNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Private Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Add these to your .env file:
VAPID_PUBLIC_KEY=BNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPID_PRIVATE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPID_SUBJECT=mailto:your-email@example.com
```

**Notes:**
- Keys are unique per installation
- Keep private key secret
- Public key is exposed to frontend
- Required for push notifications to work

## URLs & CORS

### FRONTEND_URL

**Required:** Yes
**Default:** -
**Description:** Frontend application URL for CORS

```bash
# Development
FRONTEND_URL=http://localhost:5173

# Production
FRONTEND_URL=https://yourdomain.com
```

**Used for:**
- CORS configuration
- Email links
- Calendar metadata

**Notes:**
- Include protocol (http/https)
- No trailing slash
- Must match actual frontend URL

### BACKEND_URL

**Required:** Yes
**Default:** -
**Description:** Backend API URL for calendar subscriptions

```bash
# Development
BACKEND_URL=http://localhost:5071

# Production
BACKEND_URL=https://api.yourdomain.com
```

**Used for:**
- Calendar subscription URLs (.ics files)
- Webhook callbacks

**Notes:**
- Must be publicly accessible for calendar subscriptions
- Include protocol (http/https)
- No trailing slash

## Timezone Configuration

### TZ

**Required:** No
**Default:** `UTC`
**Description:** Timezone for cron jobs and scheduled tasks

```bash
TZ=Europe/Paris
```

**Common timezones:**

**Europe:**
```bash
TZ=Europe/London      # GMT/BST
TZ=Europe/Paris       # CET/CEST
TZ=Europe/Berlin      # CET/CEST
TZ=Europe/Madrid      # CET/CEST
TZ=Europe/Rome        # CET/CEST
```

**Americas:**
```bash
TZ=America/New_York      # EST/EDT
TZ=America/Chicago       # CST/CDT
TZ=America/Denver        # MST/MDT
TZ=America/Los_Angeles   # PST/PDT
TZ=America/Toronto       # EST/EDT
TZ=America/Mexico_City   # CST
```

**Asia:**
```bash
TZ=Asia/Tokyo            # JST
TZ=Asia/Shanghai         # CST
TZ=Asia/Singapore        # SGT
TZ=Asia/Dubai            # GST
TZ=Asia/Kolkata          # IST
```

**Oceania:**
```bash
TZ=Australia/Sydney      # AEDT/AEST
TZ=Pacific/Auckland      # NZDT/NZST
```

**Other:**
```bash
TZ=UTC                   # Coordinated Universal Time
```

**Full list:** [Wikipedia - List of tz database time zones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

**Notes:**
- Affects email and push notification timing
- Use IANA timezone format
- Critical for correct notification timing

## Examples

### Development (.env)

```bash
# Backend
PORT=5071
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/subly

# Security
JWT_SECRET=dev_secret_change_in_production_minimum_32_chars

# URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5071
VITE_API_URL=http://localhost:5071

# Email (optional for development)
# RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
# EMAIL_FROM=noreply@yourdomain.com

# Timezone
TZ=Europe/Paris
```

### Production (.env)

```bash
# Backend
PORT=5071
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://user:secure_password@cluster.mongodb.net/subly?retryWrites=true&w=majority

# Security
JWT_SECRET=VERY_SECURE_RANDOM_STRING_MINIMUM_32_CHARACTERS_GENERATED_RANDOMLY

# URLs
FRONTEND_URL=https://subly.yourdomain.com
BACKEND_URL=https://api.yourdomain.com
VITE_API_URL=https://api.yourdomain.com

# Email
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com

# Push Notifications
VAPID_PUBLIC_KEY=BNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPID_PRIVATE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPID_SUBJECT=mailto:admin@yourdomain.com

# Timezone
TZ=Europe/Paris
```

### Docker Compose

```yaml
services:
  subly:
    image: zlimteck/subly:latest
    environment:
      - NODE_ENV=production
      - PORT=5071
      - MONGODB_URI=mongodb://subly_admin:secure_password@mongodb:27017/subly?authSource=admin
      - JWT_SECRET=secure_random_string_minimum_32_characters
      - FRONTEND_URL=http://localhost:3000
      - BACKEND_URL=http://localhost:5071
      - RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
      - EMAIL_FROM=noreply@yourdomain.com
      - VAPID_PUBLIC_KEY=BNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
      - VAPID_PRIVATE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
      - VAPID_SUBJECT=mailto:admin@yourdomain.com
      - TZ=Europe/Paris
```

## Security Best Practices

### 1. Never Commit Secrets

Add `.env` to `.gitignore`:
```bash
# .gitignore
.env
.env.local
.env.production
```

### 2. Use Strong Secrets

```bash
# Bad
JWT_SECRET=secret123

# Good
JWT_SECRET=7f8a9d3e2c1b5a4f6e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f
```

### 3. Different Secrets per Environment

```bash
# Development
JWT_SECRET=dev_secret_for_local_testing

# Staging
JWT_SECRET=staging_secret_different_from_prod

# Production
JWT_SECRET=production_secret_very_secure
```

### 4. Rotate Secrets Regularly

- Change JWT_SECRET periodically
- Invalidates all existing tokens
- Plan for user re-authentication

### 5. Use Environment-Specific URLs

```bash
# Development
FRONTEND_URL=http://localhost:5173

# Production
FRONTEND_URL=https://yourdomain.com
```

### 6. Protect Database Credentials

```bash
# Bad - weak password
MONGODB_URI=mongodb://admin:admin@localhost/subly

# Good - strong password
MONGODB_URI=mongodb://admin:Xy9$mK#pL2@vN8qR@localhost/subly
```

### 7. URL Encode Special Characters

```bash
# Password: My$ecret!Pass
# Encoded: My%24ecret%21Pass
MONGODB_URI=mongodb://user:My%24ecret%21Pass@host/db
```

### 8. Use HTTPS in Production

```bash
# Development (HTTP OK)
FRONTEND_URL=http://localhost:5173

# Production (HTTPS required)
FRONTEND_URL=https://yourdomain.com
```

### 9. Restrict CORS Origins

Only allow trusted frontend URLs:
```bash
FRONTEND_URL=https://yourdomain.com
```

### 10. Use Secrets Manager

For production, consider using:
- AWS Secrets Manager
- Azure Key Vault
- Google Secret Manager
- HashiCorp Vault
- Docker Secrets

## Validation

### Required Variables Check

Backend validates required variables on startup:

```javascript
// Required variables
const required = [
  'MONGODB_URI',
  'JWT_SECRET',
  'FRONTEND_URL',
  'BACKEND_URL'
];

// Check if all required variables are set
required.forEach(key => {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
});
```

### Test Configuration

```bash
# Test MongoDB connection
node -e "require('./backend/src/config/db').connectDB()"

# Test environment variables
node -e "console.log(process.env.JWT_SECRET ? 'JWT_SECRET is set' : 'JWT_SECRET missing')"
```

## Troubleshooting

### Environment Variables Not Loading

**Check file location:**
```bash
ls -la .env
```

**Check file format:**
```bash
# No spaces around =
PORT=5071  # Correct
PORT = 5071  # Wrong
```

**Restart server:**
```bash
# Changes require restart
npm run dev
```

### MongoDB Connection Failed

**Test connection string:**
```bash
mongosh "your-connection-string"
```

**Common issues:**
- Incorrect username/password
- IP not whitelisted (Atlas)
- Network connectivity
- URL encoding of special characters

### CORS Errors

**Check FRONTEND_URL matches:**
```bash
# Must match exactly
FRONTEND_URL=http://localhost:5173  # Correct
FRONTEND_URL=http://localhost:5173/  # Wrong (trailing slash)
FRONTEND_URL=localhost:5173  # Wrong (missing protocol)
```

### Email Not Sending

**Check configuration:**
```bash
# Both required
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
```

**Verify API key:**
- Check Resend dashboard
- Ensure key is active
- Check rate limits

## Next Steps

- [Installation Guide](./INSTALLATION.md) - Complete installation instructions
- [Docker Guide](./DOCKER.md) - Docker deployment
- [Development Guide](./DEVELOPMENT.md) - Local development
- [API Documentation](./API.md) - API endpoints reference

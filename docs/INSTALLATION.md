# Installation Guide

Complete guide for installing and configuring Subly.

## Table of Contents

- [Prerequisites](#prerequisites)
- [MongoDB Setup](#mongodb-setup)
- [Installation Methods](#installation-methods)
- [Initial Configuration](#initial-configuration)
- [Email Configuration](#email-configuration)
- [Push Notifications Setup](#push-notifications-setup)
- [Invitation System](#invitation-system)
- [Admin Account Setup](#admin-account-setup)
- [Timezone Configuration](#timezone-configuration)

## Prerequisites

### System Requirements

- **Node.js**: v18 or higher
- **npm**: v9 or higher (comes with Node.js)
- **MongoDB**: v6.0 or higher (local or Atlas)
- **Docker** (optional): v20.10 or higher
- **Docker Compose** (optional): v2.0 or higher

### Check Your Versions

```bash
node --version
npm --version
docker --version
docker-compose --version
```

## MongoDB Setup

Subly requires a MongoDB database. You can use either MongoDB Atlas (recommended) or a local MongoDB instance.

### Option 1: MongoDB Atlas (Recommended)

MongoDB Atlas is a free cloud-hosted MongoDB service.

1. **Create Account**
   - Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account

2. **Create Cluster**
   - Click "Build a Database"
   - Select "FREE" tier (M0 Sandbox)
   - Choose your preferred region
   - Click "Create Cluster"

3. **Configure Security**
   - Create database user:
     - Username: `subly_user`
     - Password: Generate a secure password
   - Add IP address:
     - Click "Network Access"
     - Click "Add IP Address"
     - Select "Allow Access from Anywhere" (0.0.0.0/0) for development
     - For production, add your server's IP

4. **Get Connection String**
   - Click "Connect" on your cluster
   - Select "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password
   - Replace `myFirstDatabase` with `subly`

Example connection string:
```
mongodb+srv://subly_user:your_password@cluster0.xxxxx.mongodb.net/subly?retryWrites=true&w=majority
```

### Option 2: Local MongoDB

Install MongoDB locally for development.

**macOS (Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community@8.0
brew services start mongodb-community@8.0
```

**Ubuntu/Debian:**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-8.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

**Docker:**
```bash
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  -v mongodb_data:/data/db \
  mongo:8.0
```

Connection string for local MongoDB:
```
mongodb://admin:password@localhost:27017/subly?authSource=admin
```

## Installation Methods

Choose the installation method that best suits your needs.

### Method 1: Docker Compose (Easiest)

Perfect for production and quick testing.

1. **Download Docker Compose file:**
```bash
curl -O https://raw.githubusercontent.com/zlimteck/subly_app/main/docker-compose.yml
```

2. **Edit configuration:**
```bash
nano docker-compose.yml
```

Update these values:
```yaml
MONGO_INITDB_ROOT_PASSWORD: your_secure_password
JWT_SECRET: your_jwt_secret_here
RESEND_API_KEY: re_xxxxxxxxxxxxxxxxxxxx  # Optional
EMAIL_FROM: noreply@yourdomain.com        # Optional
```

3. **Start services:**
```bash
docker-compose up -d
```

See [DOCKER.md](./DOCKER.md) for detailed Docker instructions.

### Method 2: Docker Hub Image

Use the pre-built image from Docker Hub.

```bash
docker pull zlimteck/subly:latest

docker run -d \
  --name subly \
  -p 3000:80 \
  -p 5071:5071 \
  -e MONGODB_URI="your-mongodb-uri" \
  -e JWT_SECRET="your-jwt-secret" \
  -e FRONTEND_URL="http://localhost:3000" \
  -e BACKEND_URL="http://localhost:5071" \
  zlimteck/subly:latest
```

### Method 3: From Source (Development)

For local development and customization.

1. **Clone repository:**
```bash
git clone https://github.com/zlimteck/subly_app.git
cd subly_app
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment:**
```bash
cp .env.example .env
nano .env
```

4. **Start development servers:**
```bash
npm run dev
```

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed development instructions.

## Initial Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Backend Configuration
PORT=5071
NODE_ENV=production

# MongoDB Connection
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/subly

# JWT Secret (generate at https://randomkeygen.com/)
JWT_SECRET=your_secure_random_string_here

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5071

# Email Service (Optional)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com

# Push Notifications (Optional)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:noreply@yourdomain.com

# Timezone for Cron Jobs
TZ=Europe/Paris
```

See [CONFIGURATION.md](./CONFIGURATION.md) for complete environment variable reference.

### Generate JWT Secret

Generate a secure random string for JWT_SECRET:

**Option 1: Online Generator**
- Visit [randomkeygen.com](https://randomkeygen.com/)
- Copy a "Fort Knox Password"

**Option 2: Command Line**
```bash
# macOS/Linux
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Email Configuration

Subly uses [Resend](https://resend.com) for email notifications (trial reminders, renewal alerts, verification emails).

### Setup Resend

1. **Create Account**
   - Go to [resend.com](https://resend.com)
   - Sign up for free account (3,000 emails/month free)

2. **Get API Key**
   - Go to API Keys section
   - Click "Create API Key"
   - Name it "Subly"
   - Copy the API key (starts with `re_`)

3. **Verify Domain (Optional but Recommended)**
   - Go to Domains section
   - Add your domain
   - Follow DNS verification steps
   - Use verified domain in `EMAIL_FROM`

4. **Add to Configuration**
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
```

### Email Features

When configured, Subly will send:
- **Verification emails** when users register
- **Welcome emails** after email verification
- **Trial expiration alerts** (configurable days before)
- **Renewal reminders** for upcoming subscriptions

### Testing Email

After configuration, test emails by:
1. Registering a new account
2. Check inbox for verification email
3. Verify email address
4. Check for welcome email

## Push Notifications Setup

Enable browser push notifications for payment reminders.

### Generate VAPID Keys

VAPID keys are required for web push notifications.

**From Source:**
```bash
node backend/scripts/generateVapidKeys.js
```

**From Docker:**
```bash
docker exec -it subly-app node /app/backend/scripts/generateVapidKeys.js
```

Output:
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

### Add to Configuration

Copy the keys to your `.env` file:

```bash
VAPID_PUBLIC_KEY=BNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPID_PRIVATE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPID_SUBJECT=mailto:noreply@yourdomain.com
```

### Enable in Application

Users can enable push notifications in their profile settings:
1. Log in to Subly
2. Click profile icon
3. Enable "Push Notifications"
4. Accept browser notification permission
5. Configure reminder days (1, 3, or 7 days before)

## Invitation System

Subly uses an invitation-only registration system to control access.

### Generate Invitation Code

**From Source:**
```bash
node backend/scripts/generateInvite.js
```

**From Docker:**
```bash
docker exec -it subly-app node /app/backend/scripts/generateInvite.js
```

Output:
```
Invitation code generated: ABC123
Expires: Never
```

### Generate Multiple Codes

You can generate codes programmatically:

```javascript
// In Node.js REPL or script
const crypto = require('crypto');
const code = crypto.randomBytes(3).toString('hex').toUpperCase();
console.log(code);
```

### Admin Panel Code Generation

Once you have an admin account:
1. Log in to Subly
2. Click admin panel icon
3. Go to "Invitations" tab
4. Click "Generate Code"
5. Set expiration (optional)
6. Add note (optional)
7. Share code with new users

### Invitation Features

- **Expiration dates**: Set when codes expire
- **One-time use**: Codes can only be used once
- **Notes**: Add context to invitations
- **Tracking**: See who used which code
- **Revocation**: Delete unused codes

## Admin Account Setup

The first user should be promoted to admin to manage the system.

### Promote User to Admin

**From Source:**
```bash
node backend/scripts/promoteAdmin.js your-username
```

**From Docker:**
```bash
docker exec -it subly-app node /app/backend/scripts/promoteAdmin.js your-username
```

Output:
```
User 'your-username' has been promoted to admin.
```

### Admin Features

Admin accounts can:
- Generate invitation codes
- View all invitations
- Manage users (view, deactivate, restore, delete)
- View system statistics
- Access admin panel

### Access Admin Panel

After promotion:
1. Log out and log back in
2. Click the admin icon in top navigation
3. Access user management and invitations

## Timezone Configuration

Set the timezone for cron jobs (email and push notifications).

### Common Timezones

```bash
# Europe
TZ=Europe/Paris
TZ=Europe/London
TZ=Europe/Berlin

# Americas
TZ=America/New_York
TZ=America/Los_Angeles
TZ=America/Chicago

# Asia
TZ=Asia/Tokyo
TZ=Asia/Shanghai
TZ=Asia/Dubai

# Other
TZ=UTC
TZ=Australia/Sydney
```

Full list: [Wikipedia - List of tz database time zones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

### Configuration

Add to `.env` file:
```bash
TZ=Europe/Paris
```

Or in docker-compose.yml:
```yaml
environment:
  - TZ=Europe/Paris
```

### Verify Timezone

Check if timezone is set correctly:

```bash
# From source
TZ=Europe/Paris node -e "console.log(new Date().toString())"

# From Docker
docker exec -it subly-app date
```

## Post-Installation Steps

1. **Generate invitation code**
2. **Register first user** with invitation code
3. **Promote user to admin**
4. **Configure email** (optional but recommended)
5. **Setup push notifications** (optional)
6. **Set timezone** for your region
7. **Test the application**
8. **Generate more invitation codes** for other users

## Verification

Verify your installation is working:

- [ ] Application loads at http://localhost:3000
- [ ] API responds at http://localhost:5071/health
- [ ] MongoDB connection is successful
- [ ] Registration works with invitation code
- [ ] Login works
- [ ] Can create subscriptions
- [ ] Email notifications work (if configured)
- [ ] Push notifications work (if configured)
- [ ] Admin panel accessible (after promotion)

## Troubleshooting

### MongoDB Connection Failed

- Verify MongoDB is running
- Check connection string format
- Ensure IP whitelist includes your IP (Atlas)
- Verify username/password

### Email Not Sending

- Verify RESEND_API_KEY is correct
- Check EMAIL_FROM domain is verified
- Check Resend dashboard for errors
- Ensure user has verified email enabled

### Push Notifications Not Working

- Verify VAPID keys are generated and configured
- Check browser supports push notifications
- Ensure HTTPS in production (required for push)
- User must enable notifications in profile

### Invitation Code Invalid

- Generate new code
- Check code hasn't been used
- Verify code hasn't expired
- Case-sensitive match (use uppercase)

### Can't Access Admin Panel

- Verify user was promoted to admin
- Log out and log back in
- Check browser console for errors
- Verify JWT token is valid

## Next Steps

- [Docker Guide](./DOCKER.md) - Docker deployment options
- [Development Guide](./DEVELOPMENT.md) - Local development setup
- [Configuration Reference](./CONFIGURATION.md) - All environment variables
- [API Documentation](./API.md) - REST API endpoints

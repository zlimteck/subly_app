# Docker Deployment Guide

This guide covers all Docker deployment options for Subly.

## Table of Contents

- [Quick Start with Docker Compose](#quick-start-with-docker-compose)
- [Docker Hub Image](#docker-hub-image)
- [Docker Compose Configurations](#docker-compose-configurations)
- [Single Container Deployment](#single-container-deployment)
- [Environment Variables](#environment-variables)
- [Running Scripts in Containers](#running-scripts-in-containers)
- [Volumes and Data Persistence](#volumes-and-data-persistence)

## Quick Start with Docker Compose

The fastest way to get Subly running with Docker.

### 1. Download Docker Compose File

```bash
curl -O https://raw.githubusercontent.com/zlimteck/subly_app/main/docker-compose.yml
```

### 2. Edit Configuration

Open `docker-compose.yml` and update these critical values:

```yaml
# Change MongoDB password
MONGO_INITDB_ROOT_PASSWORD: your_secure_password

# Change JWT secret (generate one at https://randomkeygen.com/)
JWT_SECRET: your_jwt_secret_here

# Optional: Add email service (get API key at https://resend.com)
RESEND_API_KEY: re_xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM: noreply@yourdomain.com

# Optional: Add push notifications (generate with scripts/generateVapidKeys.js)
VAPID_PUBLIC_KEY: your_vapid_public_key_here
VAPID_PRIVATE_KEY: your_vapid_private_key_here
```

### 3. Start Services

```bash
docker-compose up -d
```

### 4. Generate Invitation Code

```bash
docker exec -it subly-app node /app/backend/scripts/generateInvite.js
```

### 5. Access Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5071

### 6. Promote First User to Admin

After registering your account:

```bash
docker exec -it subly-app node /app/backend/scripts/promoteAdmin.js your-username
```

## Docker Hub Image

Subly is available as a pre-built image on Docker Hub.

### Pull Latest Image

```bash
docker pull zlimteck/subly:latest
```

### Run with Docker Run

```bash
docker run -d \
  --name subly \
  -p 3000:80 \
  -p 5071:5071 \
  -e MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/subly" \
  -e JWT_SECRET="your-jwt-secret" \
  -e FRONTEND_URL="http://localhost:3000" \
  -e BACKEND_URL="http://localhost:5071" \
  -e RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx" \
  -e EMAIL_FROM="noreply@yourdomain.com" \
  zlimteck/subly:latest
```

## Docker Compose Configurations

### With Local MongoDB (Recommended for Testing)

The default `docker-compose.yml` includes a MongoDB container:

```yaml
services:
  mongodb:
    image: mongo:8.0
    container_name: subly-mongodb
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=subly_admin
      - MONGO_INITDB_ROOT_PASSWORD=change_this_password
      - MONGO_INITDB_DATABASE=subly
    volumes:
      - mongodb_data:/data/db
      - mongodb_config:/data/configdb
    restart: unless-stopped

  subly:
    image: zlimteck/subly:latest
    container_name: subly-app
    ports:
      - "3000:80"
      - "5071:5071"
    environment:
      - MONGODB_URI=mongodb://subly_admin:change_this_password@mongodb:27017/subly?authSource=admin
      - JWT_SECRET=your_jwt_secret_here
    depends_on:
      - mongodb

volumes:
  mongodb_data:
  mongodb_config:
```

### With MongoDB Atlas (Recommended for Production)

Comment out the `mongodb` service and use MongoDB Atlas:

```yaml
services:
  subly:
    image: zlimteck/subly:latest
    container_name: subly-app
    ports:
      - "3000:80"
      - "5071:5071"
    environment:
      - MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/subly
      - JWT_SECRET=your_jwt_secret_here
      - FRONTEND_URL=http://localhost:3000
      - BACKEND_URL=http://localhost:5071
    restart: unless-stopped
```

### With Bind Mounts (For Development)

Mount local code for development:

```yaml
services:
  subly:
    image: zlimteck/subly:latest
    container_name: subly-app
    ports:
      - "3000:80"
      - "5071:5071"
    volumes:
      - ./backend:/app/backend
      - ./frontend:/app/frontend
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongodb:27017/subly
      - JWT_SECRET=your_jwt_secret_here
```

## Single Container Deployment

For production deployments where you want to build your own image.

### Build Production Image

```bash
docker build -f Dockerfile.prod -t subly:prod .
```

### Run Production Container

```bash
docker run -d \
  --name subly-prod \
  -p 3000:80 \
  -p 5071:5071 \
  -e MONGODB_URI="your-mongodb-uri" \
  -e JWT_SECRET="your-jwt-secret" \
  -e FRONTEND_URL="https://yourdomain.com" \
  -e BACKEND_URL="https://yourdomain.com/api" \
  -e RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx" \
  -e EMAIL_FROM="noreply@yourdomain.com" \
  -e VAPID_PUBLIC_KEY="your_vapid_public_key" \
  -e VAPID_PRIVATE_KEY="your_vapid_private_key" \
  -e VAPID_SUBJECT="mailto:noreply@yourdomain.com" \
  -e TZ="Europe/Paris" \
  --restart unless-stopped \
  subly:prod
```

## Environment Variables

Required environment variables for Docker deployment:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `MONGODB_URI` | Yes | MongoDB connection string | `mongodb://localhost/subly` |
| `JWT_SECRET` | Yes | Secret for JWT tokens | `random-string-here` |
| `FRONTEND_URL` | Yes | Frontend URL for CORS | `http://localhost:3000` |
| `BACKEND_URL` | Yes | Backend URL for calendar | `http://localhost:5071` |
| `RESEND_API_KEY` | No | Resend API key for emails | `re_xxxxx` |
| `EMAIL_FROM` | No | Sender email address | `noreply@domain.com` |
| `VAPID_PUBLIC_KEY` | No | VAPID public key for push | See generateVapidKeys.js |
| `VAPID_PRIVATE_KEY` | No | VAPID private key for push | See generateVapidKeys.js |
| `VAPID_SUBJECT` | No | VAPID subject (email) | `mailto:admin@domain.com` |
| `TZ` | No | Timezone for cron jobs | `Europe/Paris` |
| `NODE_ENV` | No | Node environment | `production` |
| `PORT` | No | Backend port | `5071` |

See [CONFIGURATION.md](./CONFIGURATION.md) for complete environment variable reference.

## Running Scripts in Containers

Subly includes several utility scripts for administration.

### Generate Invitation Code

```bash
docker exec -it subly-app node /app/backend/scripts/generateInvite.js
```

Output:
```
Invitation code generated: ABC123
Expires: Never
```

### Promote User to Admin

```bash
docker exec -it subly-app node /app/backend/scripts/promoteAdmin.js username
```

### Generate VAPID Keys

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

## Volumes and Data Persistence

### MongoDB Data Volumes

When using local MongoDB, data is persisted in Docker volumes:

```yaml
volumes:
  mongodb_data:
    driver: local
  mongodb_config:
    driver: local
```

### View Volumes

```bash
docker volume ls
```

### Backup MongoDB Data

```bash
# Backup
docker exec subly-mongodb mongodump --out /backup
docker cp subly-mongodb:/backup ./mongodb-backup

# Restore
docker cp ./mongodb-backup subly-mongodb:/backup
docker exec subly-mongodb mongorestore /backup
```

### Remove Volumes (Caution: Data Loss)

```bash
docker-compose down -v
```

## Docker Compose Commands

### Start Services

```bash
docker-compose up -d
```

### Stop Services

```bash
docker-compose down
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f subly
docker-compose logs -f mongodb
```

### Restart Services

```bash
docker-compose restart
```

### Rebuild and Start

```bash
docker-compose up -d --build
```

### Check Status

```bash
docker-compose ps
```

## Troubleshooting

### Container Won't Start

Check logs:
```bash
docker logs subly-app
```

### MongoDB Connection Issues

Verify MongoDB is running:
```bash
docker-compose ps mongodb
docker logs subly-mongodb
```

Test connection:
```bash
docker exec -it subly-mongodb mongosh -u subly_admin -p your_password
```

### Port Already in Use

Change ports in docker-compose.yml:
```yaml
ports:
  - "8080:80"      # Changed from 3000
  - "8071:5071"    # Changed from 5071
```

### Permission Issues

Ensure Docker has proper permissions:
```bash
sudo chown -R $(whoami):$(whoami) .
```

## Production Recommendations

1. **Use MongoDB Atlas** instead of local MongoDB for better reliability
2. **Set strong passwords** for MongoDB and JWT secret
3. **Use HTTPS** with a reverse proxy (nginx, Traefik, Caddy)
4. **Configure email** for notifications and verification
5. **Enable push notifications** for better user experience
6. **Set up backups** for MongoDB data
7. **Monitor logs** regularly
8. **Update regularly** to get latest security patches

```bash
# Update to latest version
docker-compose pull
docker-compose up -d
```

## Next Steps

- [Installation Guide](./INSTALLATION.md) - Detailed installation instructions
- [Configuration Reference](./CONFIGURATION.md) - All environment variables
- [API Documentation](./API.md) - API endpoints reference

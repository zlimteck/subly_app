# Subly - Subscription Expense Tracker

![subly logo](https://zupimages.net/up/25/45/7734.png)

A modern web application for tracking and managing your subscription expenses with automated reminders and comprehensive analytics.

## Features

### Core Functionality
- **Subscription Management**: Track monthly and annual subscriptions with detailed information
- **Smart Calculations**: Automatically calculates monthly costs from annual subscriptions
- **Trial Tracking**: Monitor free trials with automatic expiration reminders
- **Data Visualization**: Interactive charts showing spending by category and top subscriptions
- **Statistics Dashboard**: Real-time totals and breakdowns of your expenses

### User Experience
- **Dark Terminal Theme**: Modern dark interface with green terminal-style aesthetics and light mode option
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Intuitive Forms**: Easy-to-use interfaces for adding and editing subscriptions
- **Data Export**: Export your subscription data in JSON or CSV format
- **Calendar Integration**: Subscribe to or download iCal calendar feed with automatic synchronization

### Security & Authentication
- **Email Verification**: Secure account verification with automated emails
- **JWT Authentication**: Token-based authentication with encrypted passwords
- **Invitation System**: Admin-controlled user registration with invitation codes
- **Role-Based Access**: Admin and user roles with different permissions

### Notifications & Reminders
- **Email Notifications**: Automated email alerts at 3 days and 1 day before trial expiration
- **Web Push Notifications**: Browser push notifications for trial endings and payment reminders
- **Multi-language Support**: Notifications in English and French based on user preference
- **Configurable Reminders**: Choose to be reminded 1, 3, or 7 days before payment due
- **Subscription Renewals**: Daily cron job checks and updates subscription billing dates
- **User Preferences**: Granular control over notification types and timing
- **Beautiful Templates**: Terminal-themed HTML emails and native browser notifications

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier available at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas))
- Resend API key (optional, for email notifications - free tier at [resend.com](https://resend.com))
- Docker (optional, for containerized deployment)

### Installation & Setup

**1. Clone the repository**
```bash
git clone https://github.com/zlimteck/subly_app.git
cd subly_app
```

**2. Install dependencies**
```bash
npm install
```

**3. Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` and configure the **required** variables:
```env
# MongoDB Atlas connection (REQUIRED)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/subly

# JWT Secret - Generate a secure random string (REQUIRED)
# You can use: https://randomkeygen.com/
JWT_SECRET=your-secure-random-string-here

# Frontend and Backend URLs (default is fine for dev)
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5071
```

Optional email configuration (for trial/renewal notifications):
```env
# Resend API Configuration (OPTIONAL)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
```

Optional Web Push Notifications (browser notifications):
```env
# Web Push Notifications (OPTIONAL - not required for basic functionality)
# Generate VAPID keys with: node backend/scripts/generateVapidKeys.js
VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here
VAPID_SUBJECT=mailto:noreply@yourdomain.com
```

Optional Timezone Configuration (for cron jobs):
```env
# Timezone for cron jobs (OPTIONAL - defaults to UTC)
# Examples: Europe/Paris, America/New_York, Asia/Tokyo, UTC See full list: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
TZ=Europe/Paris
```

**Note:** VAPID keys are only needed if you want browser push notifications. The app works perfectly without them.

To generate VAPID keys, run:
```bash
node backend/scripts/generateVapidKeys.js
```

**4. Generate an invitation code**

Before you can create an account, you need to generate an invitation code:

```bash
node backend/scripts/generateInvite.js
```

This will output a code like: `SUBLY-XXXX-XXXX-XXXX-XXXX`

**Advanced options:**
```bash
# Generate 5 codes
node backend/scripts/generateInvite.js 5

# Generate code that expires in 30 days
node backend/scripts/generateInvite.js 1 30

# Generate code with a note
node backend/scripts/generateInvite.js 1 30 "For John"
```

**5. Start the development servers**
```bash
npm run dev
```

The application will be available at:
- 🌐 **Frontend**: http://localhost:5173
- 🔌 **Backend API**: http://localhost:5071

**6. Create your first account**

1. Open http://localhost:5173 in your browser
2. Click "Sign Up" / "S'inscrire"
3. Use the invitation code from step 4
4. Fill in your details and create your account

**7. Promote your account to admin (optional)**

If you want access to the admin panel to generate more invitation codes:

```bash
node backend/scripts/promoteAdmin.js your-username
```

Now you can access the admin panel from your profile menu!

## Screenshots

<details>
<summary>Login Page</summary>

![Login Page](https://zupimages.net/up/25/45/froy.png)

</details>

<details>
<summary>Register Page</summary>

![Register Page](https://zupimages.net/up/25/45/kghe.png)

</details>

<details>
<summary>Dashboard - Terminal Dark Theme</summary>

![Dashboard Terminal Dark](https://zupimages.net/up/25/45/8nq2.png)

</details>

<details>
<summary>Dashboard - Dracula Theme</summary>

![Dashboard Dracula](https://zupimages.net/up/25/45/9yxh.png)

</details>

<details>
<summary>Dashboard - Nord Theme</summary>

![Dashboard Nord](https://zupimages.net/up/25/45/wm0o.png)

</details>

<details>
<summary>Dashboard - Light Mode</summary>

![Dashboard Light](https://zupimages.net/up/25/45/7kg5.png)

</details>

<details>
<summary>Dashboard - Solarized Dark</summary>

![Dashboard Light](https://zupimages.net/up/25/45/zl5q.png)

</details>

<details>
<summary>Profile Modal</summary>

![Profile Modal](https://zupimages.net/up/25/45/9t0n.png)

</details>

### Docker Deployment

#### Option 1: Use Pre-built Image from Docker Hub (Recommended)

Pull and run the latest official image:

```bash
docker pull zlimteck/subly:latest

docker run -d \
  --name subly \
  -e MONGODB_URI="your-uri" \
  -e JWT_SECRET="your-secret" \
  -e RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx" \
  -e EMAIL_FROM="noreply@yourdomain.com" \
  -e VAPID_PUBLIC_KEY="your_vapid_public_key" \
  -e VAPID_PRIVATE_KEY="your_vapid_private_key" \
  -e VAPID_SUBJECT="mailto:noreply@yourdomain.com" \
  -e TZ="Europe/Paris" \
  -e FRONTEND_URL="https://yourdomain.com" \
  -e BACKEND_URL="https://yourdomain.com" \
  -p 3000:80 -p 5071:5071 \
  --restart unless-stopped \
  zlimteck/subly:latest
```

Or use a specific version:
```bash
docker pull zlimteck/subly:1.2.2
docker run -d --name subly [same options as above] zlimteck/subly:1.2.2
```

#### Option 2: Build from Source

**Development with Docker Compose:**
```bash
docker-compose up --build
```

**Production single container:**
```bash
docker build -f Dockerfile.prod -t subly:prod .
docker run -d \
  --name subly \
  -e MONGODB_URI="your-uri" \
  -e JWT_SECRET="your-secret" \
  -e RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx" \
  -e EMAIL_FROM="noreply@yourdomain.com" \
  -e VAPID_PUBLIC_KEY="your_vapid_public_key" \
  -e VAPID_PRIVATE_KEY="your_vapid_private_key" \
  -e VAPID_SUBJECT="mailto:noreply@yourdomain.com" \
  -e TZ="Europe/Paris" \
  -e FRONTEND_URL="https://yourdomain.com" \
  -e BACKEND_URL="https://yourdomain.com" \
  -p 3000:80 -p 5071:5071 \
  --restart unless-stopped \
  subly:prod
```

### Docker Compose Production (Easiest for Self-Hosting)

The `docker-compose.yml` uses the pre-built Docker Hub image and includes:
- **Subly application** (frontend + backend in one container)
- **MongoDB 8.0** (local database with persistent volumes)

#### Quick Start

**1. Edit MongoDB credentials** in `docker-compose.yml` (lines 9-10):
```yaml
- MONGO_INITDB_ROOT_PASSWORD=change_this_password  # Change this!
```

**2. Update the MongoDB URI** (line 32) with the same password:
```yaml
- MONGODB_URI=mongodb://subly_admin:change_this_password@mongodb:27017/subly?authSource=admin
```

**3. Configure required variables**:
```yaml
- JWT_SECRET=your_secure_random_string  # Generate at https://randomkeygen.com/
```

**4. Start everything**:
```bash
docker-compose up -d
```

**5. Access the application**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5071

The MongoDB data is persisted in Docker volumes (`mongodb_data` and `mongodb_config`).

#### Using a Specific Version

To use a specific version instead of `latest`, edit line 23:
```yaml
image: zlimteck/subly:1.3.0  # Replace with desired version
```

#### Using MongoDB Atlas Instead

If you prefer MongoDB Atlas cloud:

**1. Comment out the mongodb service** (lines 3-20):
```yaml
# mongodb:
#   image: mongo:8.0
#   ...
```

**2. Remove the depends_on** (lines 44-46):
```yaml
# depends_on:
#   mongodb:
#     condition: service_healthy
```

**3. Use your Atlas URI** (line 32):
```yaml
- MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/subly
```

**4. Start the stack**:
```bash
docker-compose up -d
```

## Tech Stack

### Frontend
- React 18
- Vite (build tool)
- React Router (navigation)
- Recharts (data visualization)
- Axios (HTTP client)
- Lucide React (icons)
- date-fns (date formatting)

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT (authentication)
- bcryptjs (password hashing)
- Resend (email sending)
- web-push (browser push notifications)
- node-cron (scheduled tasks)
- express-validator (validation)
- express-rate-limit (rate limiting)

### Deployment
- Docker & Docker Compose
- Nginx (reverse proxy)

## Project Structure

```
subly/
├── backend/                    # Express API server
│   ├── src/
│   │   ├── models/            # MongoDB schemas
│   │   │   ├── User.js        # User model with email verification
│   │   │   ├── Subscription.js # Subscription model with trials
│   │   │   ├── Invitation.js  # Invitation code system
│   │   │   └── PushSubscription.js # Web Push subscriptions
│   │   ├── routes/            # API endpoints
│   │   │   ├── auth.js        # Authentication & user management
│   │   │   ├── subscriptions.js # Subscription CRUD
│   │   │   ├── invitations.js # Admin invitation management
│   │   │   ├── upload.js      # File upload handling
│   │   │   └── pushRoutes.js  # Push notification endpoints
│   │   ├── services/          # Business logic
│   │   │   ├── emailService.js # Email sending
│   │   │   ├── subscriptionCron.js # Renewal automation
│   │   │   ├── trialReminderService.js # Trial notifications
│   │   │   └── pushNotificationService.js # Push notifications
│   │   ├── middleware/        # Express middleware
│   │   │   └── auth.js        # JWT verification
│   │   ├── config/            # Configuration
│   │   │   ├── db.js          # MongoDB connection
│   │   │   └── email.js       # Email setup
│   │   ├── utils/             # Utilities
│   │   │   ├── emailTemplates.js # HTML email templates
│   │   │   └── notificationTranslations.js # Push notification i18n
│   │   └── server.js          # Entry point
│   ├── scripts/               # Setup & utility scripts
│   │   ├── generateInvite.js  # Generate invitation codes
│   │   ├── promoteAdmin.js    # Promote user to admin
│   │   └── generateVapidKeys.js # Generate VAPID keys for push
│   ├── uploads/               # User-uploaded files
│   └── Dockerfile
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── Header.jsx     # Navigation header
│   │   │   ├── ProfileModal.jsx # User profile & settings
│   │   │   ├── SubscriptionForm.jsx # Add/Edit form
│   │   │   ├── SubscriptionList.jsx # Subscription cards
│   │   │   └── Charts.jsx     # Data visualizations
│   │   ├── pages/             # Page components
│   │   │   ├── Login.jsx      # Login page
│   │   │   ├── Register.jsx   # Registration page
│   │   │   ├── Dashboard.jsx  # Main dashboard
│   │   │   ├── AdminPanel.jsx # Admin interface
│   │   │   └── VerifyEmail.jsx # Email verification
│   │   ├── context/           # React contexts
│   │   │   ├── AuthContext.jsx # Authentication state
│   │   │   ├── ThemeContext.jsx # Dark/Light theme
│   │   │   └── CurrencyContext.jsx # Currency settings
│   │   ├── utils/             # Utilities
│   │   │   └── pushNotifications.js # Push notification helpers
│   │   ├── App.jsx            # Main app component
│   │   └── main.jsx           # Entry point
│   ├── public/                # Static assets
│   │   ├── sw.js              # Service Worker for push notifications
│   │   ├── manifest.json      # PWA manifest
│   │   └── icons/             # App icons
│   └── Dockerfile
├── docker-compose.yml          # Docker orchestration
├── .env.example               # Environment template
└── README.md
```

## Key Features in Detail

### Notification System

**Email Notifications:**
- Automated email alerts at 3 days and 1 day before trial expiration
- Beautiful HTML email templates with urgency indicators
- Cron job runs daily at 9:00 AM
- Prevents duplicate notifications per day

**Web Push Notifications:**
- Browser push notifications for trial endings and upcoming payments
- Works on desktop and mobile (iOS 16.4+ PWA, Android, Chrome, Firefox, Edge)
- Multi-language support (English/French) based on user preference
- User-configurable reminder timing (1, 3, or 7 days before payment)
- VAPID-based Web Push API for secure delivery
- Service Worker implementation for offline capability
- Automatic language synchronization with browser settings
- Native notification support with custom icons

### Email Verification
- SHA-256 token hashing for secure verification
- 24-hour token expiration
- Automatic welcome email after verification
- Resend verification functionality
- Email uniqueness validation

### Subscription Management
- Support for monthly and annual billing cycles
- Free trial tracking with end dates
- Automatic monthly cost calculation for annual subscriptions
- Custom categories and notes
- Logo/icon upload support
- Active/inactive status toggle

### Admin Panel
- Invitation code generation and management
- Usage tracking (used/unused invitations)
- Expiration date setting
- Multi-use invitation support
- User access control

### Calendar Integration
- **iCal Calendar Feed**: Subscribe to your payment calendar in Apple Calendar, Google Calendar, or Outlook
- **Automatic Synchronization**: Calendar updates automatically when you add or modify subscriptions
- **Recurring Events**: Monthly and annual subscriptions appear as recurring events
- **Smart Reminders**: Alarms based on your notification preferences (1, 3, or 7 days before)
- **Manual Download**: Download a snapshot .ics file for one-time import
- **Secure Token-based Access**: Each user gets a unique calendar URL

### Automated Tasks
All cron jobs run in the timezone specified by the `TZ` environment variable (defaults to UTC if not set):
- **Daily at 00:00**: Check and update subscription renewal dates
- **Daily at 09:00**: Send trial expiration reminders (email + push)
- **Daily at 09:00**: Send payment reminders based on user preferences (push)
- **On startup (dev)**: Initial checks after 5 seconds

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register with invitation code
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/password` - Change password
- `PUT /api/auth/email` - Update email address
- `PUT /api/auth/notifications` - Update email notification preferences
- `PUT /api/auth/push-preferences` - Update push notification preferences
- `GET /api/auth/verify-email/:token` - Verify email
- `POST /api/auth/resend-verification` - Resend verification email

### Subscription Endpoints
- `GET /api/subscriptions` - Get all user subscriptions
- `GET /api/subscriptions/stats` - Get spending statistics
- `POST /api/subscriptions` - Create subscription
- `PUT /api/subscriptions/:id` - Update subscription
- `DELETE /api/subscriptions/:id` - Delete subscription
- `GET /api/subscriptions/calendar-token` - Generate calendar subscription URL (protected)
- `GET /api/subscriptions/calendar/:token.ics` - Public iCal calendar feed (token-based)
- `GET /api/subscriptions/calendar.ics` - Download calendar file (protected)

### Admin Endpoints
- `POST /api/invitations` - Generate invitation code
- `GET /api/invitations` - List all invitations
- `DELETE /api/invitations/:id` - Delete invitation

### Push Notification Endpoints
- `GET /api/push/vapid-public-key` - Get VAPID public key for subscription
- `POST /api/push/subscribe` - Subscribe to push notifications (protected)
- `POST /api/push/unsubscribe` - Unsubscribe from push notifications (protected)
- `GET /api/push/status` - Get user's push subscription status (protected)

See [CLAUDE.md](./CLAUDE.md) for detailed architecture documentation.

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | No | Backend server port | `5071` (default) |
| `NODE_ENV` | No | Environment mode | `development` or `production` |
| `MONGODB_URI` | **Yes** | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/subly` |
| `JWT_SECRET` | **Yes** | Secret for JWT tokens | Random secure string |
| `FRONTEND_URL` | No | Frontend URL for CORS and calendar links | `http://localhost:5173` |
| `BACKEND_URL` | No | Backend URL for calendar subscription | `http://localhost:5071` |
| `RESEND_API_KEY` | No | Resend API key for emails | `re_xxxxxxxxxxxxxxxxxxxx` |
| `EMAIL_FROM` | No | Sender email address | `noreply@yourdomain.com` |
| `VAPID_PUBLIC_KEY` | No | VAPID public key for Web Push | Generate with `node backend/scripts/generateVapidKeys.js` |
| `VAPID_PRIVATE_KEY` | No | VAPID private key for Web Push | Generate with `node backend/scripts/generateVapidKeys.js` |
| `VAPID_SUBJECT` | No | VAPID subject (mailto or URL) | `mailto:noreply@yourdomain.com` |
| `TZ` | No | Timezone for cron jobs (IANA format) | `Europe/Paris`, `America/New_York`, `UTC` (default) |

## Security Features

- Password hashing with bcrypt (10 salt rounds)
- JWT token-based authentication (30-day expiration)
- Rate limiting on authentication routes
- Email verification required for full access
- Admin-only routes protection
- CORS configuration
- Input validation on all endpoints
- SQL injection protection (MongoDB)
- XSS protection

## Contributing

This is a personal project. If you find bugs or have suggestions, feel free to open an issue.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Credits

Built with ❤️ using modern web technologies.
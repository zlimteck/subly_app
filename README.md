# Subly - Subscription Expense Tracker

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

### Security & Authentication
- **Email Verification**: Secure account verification with automated emails
- **JWT Authentication**: Token-based authentication with encrypted passwords
- **Invitation System**: Admin-controlled user registration with invitation codes
- **Role-Based Access**: Admin and user roles with different permissions

### Notifications & Reminders
- **Trial Reminders**: Automated email alerts at 3 days and 1 day before trial expiration
- **Subscription Renewals**: Daily cron job checks and updates subscription billing dates
- **Email Preferences**: User-controlled notification settings
- **Beautiful Email Templates**: Terminal-themed HTML emails matching the app design

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

# Frontend URL for CORS (default is fine for dev)
FRONTEND_URL=http://localhost:5173
```

Optional email configuration (for trial/renewal notifications):
```env
# Resend API Configuration (OPTIONAL)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
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

### Docker Deployment

**Development with Docker Compose:**
```bash
docker-compose up --build
```

**Production single container:**
```bash
docker build -f Dockerfile.prod -t subly:prod .
docker run \
  -e MONGODB_URI="your-uri" \
  -e JWT_SECRET="your-secret" \
  -e RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx" \
  -e EMAIL_FROM="noreply@yourdomain.com" \
  -e FRONTEND_URL="https://yourdomain.com" \
  -p 3000:80 -p 5071:5071 \
  subly:prod
```

### Docker Compose Production (Recommended for Unraid)

The repository includes a complete `docker-compose.yml` file at the root. Edit it with your configuration:

```yaml
services:
  backend:
    build:
      context: /your/path/to/subly_app/backend
      dockerfile: Dockerfile
    ports:
      - "5071:5071"
    environment:
      - NODE_ENV=production
      - PORT=5071
      - MONGODB_URI=your_mongodb_uri_here
      - JWT_SECRET=your_jwt_secret_here
      - FRONTEND_URL=your_frontend_url_here
      - RESEND_API_KEY=your_resend_api_key_here
      - EMAIL_FROM=noreply@yourdomain.com
    volumes:
      - /your/path/to/subly_app/backend/uploads:/app/uploads
    restart: unless-stopped

  frontend:
    build:
      context: /your/path/to/subly_app/frontend
      dockerfile: Dockerfile
      args:
        - VITE_API_URL=your_backend_url_here
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped
```

Then run:
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
- Nodemailer (email sending)
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
│   │   │   └── Invitation.js  # Invitation code system
│   │   ├── routes/            # API endpoints
│   │   │   ├── auth.js        # Authentication & user management
│   │   │   ├── subscriptions.js # Subscription CRUD
│   │   │   ├── invitations.js # Admin invitation management
│   │   │   └── upload.js      # File upload handling
│   │   ├── services/          # Business logic
│   │   │   ├── emailService.js # Email sending
│   │   │   ├── subscriptionCron.js # Renewal automation
│   │   │   └── trialReminderService.js # Trial notifications
│   │   ├── middleware/        # Express middleware
│   │   │   └── auth.js        # JWT verification
│   │   ├── config/            # Configuration
│   │   │   ├── db.js          # MongoDB connection
│   │   │   └── email.js       # Email setup
│   │   ├── utils/             # Utilities
│   │   │   └── emailTemplates.js # HTML email templates
│   │   └── server.js          # Entry point
│   ├── scripts/               # Setup & utility scripts
│   │   ├── generateInvite.js  # Generate invitation codes
│   │   └── promoteAdmin.js    # Promote user to admin
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
│   │   ├── App.jsx            # Main app component
│   │   └── main.jsx           # Entry point
│   └── Dockerfile
├── docker-compose.yml          # Docker orchestration
├── .env.example               # Environment template
└── README.md
```

## Key Features in Detail

### Trial Reminder System
- Automated email notifications at 3 days and 1 day before trial expiration
- User-configurable notification preferences
- Cron job runs daily at 9:00 AM
- Prevents duplicate notifications per day
- Beautiful HTML email templates with urgency indicators

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

### Automated Tasks
- **Daily at 00:00**: Check and update subscription renewal dates
- **Daily at 09:00**: Send trial expiration reminders
- **On startup (dev)**: Initial checks after 5 seconds

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register with invitation code
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/password` - Change password
- `PUT /api/auth/email` - Update email address
- `PUT /api/auth/notifications` - Update notification preferences
- `GET /api/auth/verify-email/:token` - Verify email
- `POST /api/auth/resend-verification` - Resend verification email

### Subscription Endpoints
- `GET /api/subscriptions` - Get all user subscriptions
- `GET /api/subscriptions/stats` - Get spending statistics
- `POST /api/subscriptions` - Create subscription
- `PUT /api/subscriptions/:id` - Update subscription
- `DELETE /api/subscriptions/:id` - Delete subscription

### Admin Endpoints
- `POST /api/invitations` - Generate invitation code
- `GET /api/invitations` - List all invitations
- `DELETE /api/invitations/:id` - Delete invitation

See [CLAUDE.md](./CLAUDE.md) for detailed architecture documentation.

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | No | Backend server port | `5071` (default) |
| `NODE_ENV` | No | Environment mode | `development` or `production` |
| `MONGODB_URI` | **Yes** | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/subly` |
| `JWT_SECRET` | **Yes** | Secret for JWT tokens | Random secure string |
| `FRONTEND_URL` | No | Frontend URL for CORS | `http://localhost:5173` |
| `RESEND_API_KEY` | No | Resend API key for emails | `re_xxxxxxxxxxxxxxxxxxxx` |
| `EMAIL_FROM` | No | Sender email address | `noreply@yourdomain.com` |

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
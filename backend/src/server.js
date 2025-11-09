import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import subscriptionRoutes from './routes/subscriptions.js';
import uploadRoutes from './routes/upload.js';
import invitationRoutes from './routes/invitations.js';
import adminRoutes from './routes/admin.js';
import pushRoutes from './routes/pushRoutes.js';
import { startSubscriptionCron } from './services/subscriptionCron.js';
import { startTrialReminderCron } from './services/trialReminderService.js';
import { startPaymentReminderCron } from './services/paymentReminderService.js';
import { initializePushService } from './services/pushNotificationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from root directory
dotenv.config({ path: join(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy - Required when behind reverse proxy (Nginx, Traefik, etc.)
// This allows Express to read X-Forwarded-For headers correctly
app.set('trust proxy', 1);

// Connect to MongoDB
connectDB();

// Initialize push notification service
initializePushService();

// Start cron jobs
startSubscriptionCron();
startTrialReminderCron();
startPaymentReminderCron();

// Middleware - Allow multiple origins for development and production
const frontendUrls = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : [];

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  ...frontendUrls
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // In production, be more strict
      if (process.env.NODE_ENV === 'production') {
        callback(new Error('Not allowed by CORS'));
      } else {
        // In development, allow all origins
        callback(null, true);
      }
    }
  },
  credentials: true
}));
app.use(express.json());

// Serve uploaded files
app.use('/api/uploads', express.static(join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/push', pushRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Subly API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
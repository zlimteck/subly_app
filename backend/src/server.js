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
import categoryRoutes from './routes/categories.js';
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
app.use('/api/categories', categoryRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Subly API is running' });
});

// Version endpoint
app.get('/api/version', (req, res) => {
  res.json({ version: process.env.APP_VERSION || 'dev' });
});

// Check for updates endpoint (admin only)
app.get('/api/version/check-updates', async (req, res) => {
  try {
    const currentVersion = process.env.APP_VERSION || 'dev';

    // Fetch latest release and all releases from GitHub
    const [latestResponse, releasesResponse] = await Promise.all([
      fetch('https://api.github.com/repos/zlimteck/subly_app/releases/latest', {
        headers: { 'User-Agent': 'Subly-App' }
      }),
      fetch('https://api.github.com/repos/zlimteck/subly_app/releases?per_page=10', {
        headers: { 'User-Agent': 'Subly-App' }
      })
    ]);

    if (!latestResponse.ok) {
      return res.json({
        current: currentVersion,
        latest: null,
        updateAvailable: false,
        releases: [],
        error: 'Unable to check for updates'
      });
    }

    const latestRelease = await latestResponse.json();
    const latestVersion = latestRelease.tag_name.replace(/^v/, '');

    // Get all releases
    const allReleases = releasesResponse.ok ? await releasesResponse.json() : [];
    const releases = allReleases.map(release => ({
      version: release.tag_name.replace(/^v/, ''),
      name: release.name,
      body: release.body,
      publishedAt: release.published_at,
      url: release.html_url,
      isCurrent: release.tag_name.replace(/^v/, '') === currentVersion.replace(/^v/, '')
    }));

    // Simple version comparison (removes 'v' prefix if present)
    const current = currentVersion.replace(/^v/, '');
    const updateAvailable = current !== 'dev' && current !== 'latest' && current !== latestVersion;

    res.json({
      current: currentVersion,
      latest: latestVersion,
      updateAvailable,
      releaseUrl: latestRelease.html_url,
      releaseName: latestRelease.name,
      publishedAt: latestRelease.published_at,
      releases
    });
  } catch (error) {
    console.error('Error checking for updates:', error);
    res.json({
      current: process.env.APP_VERSION || 'dev',
      latest: null,
      updateAvailable: false,
      releases: [],
      error: 'Failed to check for updates'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
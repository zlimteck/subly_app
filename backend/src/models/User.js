import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  password: {
    type: String,
    required: true,
    // Note: No minlength here to allow existing users with shorter passwords
    // Validation happens at route level for new registrations only
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailNotifications: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  emailVerificationExpires: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  monthlyRevenue: {
    type: Number,
    default: 0,
    min: 0
  },
  annualRevenue: {
    type: Number,
    default: 0,
    min: 0
  },
  pushNotificationsEnabled: {
    type: Boolean,
    default: true
  },
  paymentReminderDays: {
    type: Number,
    enum: [1, 3, 7],
    default: 3
  },
  language: {
    type: String,
    enum: ['en', 'fr'],
    default: 'en'
  },
  calendarToken: {
    type: String,
    unique: true,
    sparse: true
  },
  currency: {
    type: String,
    enum: ['EUR', 'USD'],
    default: 'EUR'
  },
  theme: {
    type: String,
    enum: ['dark', 'light', 'dracula', 'nord', 'solarized'],
    default: 'dark'
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

// Method to generate or get calendar token
userSchema.methods.getCalendarToken = function() {
  if (!this.calendarToken) {
    this.calendarToken = crypto.randomBytes(32).toString('hex');
  }
  return this.calendarToken;
};

// Cascade delete subscriptions when user is deleted (hard delete)
userSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    const Subscription = mongoose.model('Subscription');
    await Subscription.deleteMany({ user: this._id });
    console.log(`🗑️ Deleted all subscriptions for user: ${this.username}`);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

export default User;
import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'annual'],
    required: true
  },
  category: {
    type: String,
    default: 'Other'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  nextBillingDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String
  },
  url: {
    type: String,
    trim: true
  },
  iconUrl: {
    type: String,
    trim: true
  },
  iconFilename: {
    type: String,
    trim: true
  },
  isTrial: {
    type: Boolean,
    default: false
  },
  trialEndDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'paypal', 'crypto', 'bank', 'paysafecard', 'revolut', null],
    default: null
  }
}, {
  timestamps: true
});

// Virtual field to calculate monthly cost
subscriptionSchema.virtual('monthlyCost').get(function() {
  if (this.billingCycle === 'annual') {
    return this.amount / 12;
  }
  return this.amount;
});

// Virtual field to check if trial is ending soon (within 3 days)
subscriptionSchema.virtual('isTrialEndingSoon').get(function() {
  if (!this.isTrial || !this.trialEndDate) return false;
  const daysUntilEnd = Math.ceil((new Date(this.trialEndDate) - new Date()) / (1000 * 60 * 60 * 24));
  return daysUntilEnd >= 0 && daysUntilEnd <= 3;
});

// Ensure virtuals are included when converting to JSON
subscriptionSchema.set('toJSON', { virtuals: true });
subscriptionSchema.set('toObject', { virtuals: true });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
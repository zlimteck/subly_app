import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date,
    default: null // null = never expires
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  usedAt: {
    type: Date,
    default: null
  },
  note: {
    type: String,
    trim: true,
    maxlength: 200
  }
}, {
  timestamps: true
});

// Indexes for faster queries
invitationSchema.index({ isUsed: 1 });
invitationSchema.index({ expiresAt: 1 });

// Method to check if invitation is valid
invitationSchema.methods.isValid = function() {
  // Check if already used
  if (this.isUsed) {
    return { valid: false, reason: 'This invitation code has already been used' };
  }

  // Check if expired
  if (this.expiresAt && new Date() > this.expiresAt) {
    return { valid: false, reason: 'This invitation code has expired' };
  }

  return { valid: true };
};

// Static method to generate unique code
invitationSchema.statics.generateCode = function() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking chars (I,O,0,1,L)
  const segments = 4;
  const segmentLength = 4;

  let code = 'SUBLY';
  for (let i = 0; i < segments; i++) {
    code += '-';
    for (let j = 0; j < segmentLength; j++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }

  return code; // Format: SUBLY-A7X9-K2M4-P8R3-V6N2
};

const Invitation = mongoose.model('Invitation', invitationSchema);

export default Invitation;
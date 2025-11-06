import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from '../src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from root directory
dotenv.config({ path: join(__dirname, '../../.env') });

async function promoteToAdmin(username) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find user
    const user = await User.findOne({ username });

    if (!user) {
      console.error(`❌ User "${username}" not found`);
      process.exit(1);
    }

    // Update role
    user.role = 'admin';
    await user.save();

    console.log(`✅ User "${username}" has been promoted to admin`);
    console.log(`   User ID: ${user._id}`);
    console.log(`   Role: ${user.role}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Get username from command line arguments
const username = process.argv[2];

if (!username) {
  console.error('Usage: node promoteAdmin.js <username>');
  process.exit(1);
}

promoteToAdmin(username);
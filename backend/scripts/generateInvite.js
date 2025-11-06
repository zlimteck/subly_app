import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Invitation from '../src/models/Invitation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from root directory
dotenv.config({ path: join(__dirname, '../../.env') });

async function generateInvitationCode(count = 1, expiresInDays = null, note = '') {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const codes = [];

    for (let i = 0; i < count; i++) {
      const invitation = new Invitation({
        note: note || 'Generated via script'
      });

      if (expiresInDays) {
        invitation.expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
      }

      await invitation.save();
      codes.push(invitation.code);
    }

    console.log(`\n✅ Successfully generated ${count} invitation code(s):\n`);
    codes.forEach((code, index) => {
      console.log(`   ${index + 1}. ${code}`);
    });

    if (expiresInDays) {
      console.log(`\n⏰ Expires in ${expiresInDays} days`);
    } else {
      console.log(`\n♾️  Never expires`);
    }

    if (note) {
      console.log(`📝 Note: ${note}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const count = parseInt(args[0]) || 1;
const expiresInDays = args[1] ? parseInt(args[1]) : null;
const note = args[2] || '';

console.log('🎫 Generating invitation code(s)...\n');
generateInvitationCode(count, expiresInDays, note);
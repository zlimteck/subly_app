import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from '../src/models/User.js';
import Category from '../src/models/Category.js';
import Subscription from '../src/models/Subscription.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from root directory
dotenv.config({ path: join(__dirname, '../../.env') });

async function migrateCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users\n`);

    let usersProcessed = 0;
    let categoriesCreated = 0;

    for (const user of users) {
      console.log(`Processing user: ${user.username} (${user._id})`);

      // Create default categories for the user
      await Category.createDefaultCategories(user._id);

      // Count how many categories were created (or already existed)
      const userCategories = await Category.countDocuments({ user: user._id });
      console.log(`  ✓ User has ${userCategories} categories`);

      // Get all unique categories from user's subscriptions
      const subscriptions = await Subscription.find({ user: user._id });
      const usedCategories = new Set(
        subscriptions
          .map(sub => sub.category)
          .filter(cat => cat && cat.trim() !== '')
      );

      // Create categories for any custom categories the user was using
      let customCreated = 0;
      for (const categoryName of usedCategories) {
        try {
          const existingCategory = await Category.findOne({
            user: user._id,
            name: categoryName
          });

          if (!existingCategory) {
            await Category.create({
              user: user._id,
              name: categoryName,
              isDefault: false
            });
            customCreated++;
          }
        } catch (error) {
          // Skip duplicates
          if (error.code !== 11000) {
            console.error(`  ⚠️  Error creating category "${categoryName}":`, error.message);
          }
        }
      }

      if (customCreated > 0) {
        console.log(`  ✓ Created ${customCreated} custom categories from existing subscriptions`);
      }

      usersProcessed++;
      categoriesCreated += userCategories;
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   Users processed: ${usersProcessed}`);
    console.log(`   Total categories: ${categoriesCreated}`);
    console.log('\n✅ Migration completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

console.log('🔄 Starting category migration...\n');
migrateCategories();
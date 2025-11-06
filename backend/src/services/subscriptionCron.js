import cron from 'node-cron';
import Subscription from '../models/Subscription.js';

/**
 * Updates subscription renewal dates that have passed
 * Runs daily at midnight (00:00)
 */
export const startSubscriptionCron = () => {
  // Run every day at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('🔄 Running subscription renewal date update...');

      const now = new Date();

      // Find all subscriptions where nextBillingDate is in the past
      const expiredSubscriptions = await Subscription.find({
        nextBillingDate: { $lt: now },
        isActive: true
      });

      console.log(`📋 Found ${expiredSubscriptions.length} subscriptions to update`);

      let updatedCount = 0;

      for (const subscription of expiredSubscriptions) {
        const currentDate = new Date(subscription.nextBillingDate);
        let newDate = new Date(currentDate);

        // Calculate how many periods have passed
        let periodsToAdd = 0;

        if (subscription.billingCycle === 'monthly') {
          // Add months until we're in the future
          while (newDate <= now) {
            newDate.setMonth(newDate.getMonth() + 1);
            periodsToAdd++;
          }
        } else if (subscription.billingCycle === 'annual') {
          // Add years until we're in the future
          while (newDate <= now) {
            newDate.setFullYear(newDate.getFullYear() + 1);
            periodsToAdd++;
          }
        }

        // Update the subscription
        subscription.nextBillingDate = newDate;
        await subscription.save();

        updatedCount++;
        console.log(`  ✅ Updated ${subscription.name}: +${periodsToAdd} ${subscription.billingCycle === 'monthly' ? 'month(s)' : 'year(s)'} → ${newDate.toLocaleDateString()}`);
      }

      console.log(`✨ Subscription renewal update complete: ${updatedCount} updated`);
    } catch (error) {
      console.error('❌ Error updating subscription renewal dates:', error);
    }
  });

  console.log('⏰ Subscription renewal cron job started (runs daily at midnight)');
};
// Update the app badge with the number of upcoming trials/notifications works on PWA (iOS 16.4+, Android, Chrome, Edge)
// Set the badge count on the app icon
export const setBadge = (count) => {
  if (!('setAppBadge' in navigator)) {
    console.log('Badge API not supported');
    return;
  }

  try {
    if (count > 0) {
      navigator.setAppBadge(count);
    } else {
      navigator.clearAppBadge();
    }
  } catch (error) {
    console.error('Failed to set app badge:', error);
  }
};

// Clear the badge from the app icon
export const clearBadge = () => {
  if (!('clearAppBadge' in navigator)) {
    return;
  }

  try {
    navigator.clearAppBadge();
  } catch (error) {
    console.error('Failed to clear app badge:', error);
  }
};

// Calculate the number of trials ending soon (within 7 days)
export const calculateBadgeCount = (subscriptions) => {
  if (!subscriptions || !Array.isArray(subscriptions)) {
    return 0;
  }

  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const trialsEndingSoon = subscriptions.filter(sub => {
    if (!sub.isTrial || !sub.trialEndDate || !sub.isActive) {
      return false;
    }

    const trialEndDate = new Date(sub.trialEndDate);
    return trialEndDate >= now && trialEndDate <= sevenDaysFromNow;
  });

  return trialsEndingSoon.length;
};

// Update the badge based on subscription data
export const updateBadge = (subscriptions) => {
  const count = calculateBadgeCount(subscriptions);
  setBadge(count);
};
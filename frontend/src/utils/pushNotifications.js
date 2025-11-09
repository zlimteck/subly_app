import axios from 'axios';

// Convert VAPID public key to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Check if push notifications are supported
export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

// Get current notification permission
export function getNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

// Register service worker
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported');
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    throw error;
  }
}

// Request notification permission
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    throw new Error('Notifications are not supported');
  }

  const permission = await Notification.requestPermission();
  return permission;
}

// Subscribe to push notifications
export async function subscribeToPush() {
  try {
    // Get service worker registration
    let registration = await navigator.serviceWorker.ready;

    if (!registration) {
      registration = await registerServiceWorker();
    }

    // Get VAPID public key from backend
    const { data } = await axios.get('/api/push/vapid-public-key');
    const vapidPublicKey = data.publicKey;

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    // Send subscription to backend
    await axios.post('/api/push/subscribe', {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
        auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth'))))
      }
    });

    console.log('Push subscription successful');
    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push:', error);
    throw error;
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Unsubscribe from browser
      await subscription.unsubscribe();

      // Notify backend
      await axios.post('/api/push/unsubscribe', {
        endpoint: subscription.endpoint
      });

      console.log('Push unsubscription successful');
    }
  } catch (error) {
    console.error('Failed to unsubscribe from push:', error);
    throw error;
  }
}

// Check if user is subscribed
export async function checkSubscriptionStatus() {
  try {
    if (!isPushSupported()) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    return !!subscription;
  } catch (error) {
    console.error('Failed to check subscription status:', error);
    return false;
  }
}

// Initialize push notifications (called on app load)
export async function initializePushNotifications() {
  if (!isPushSupported()) {
    console.log('Push notifications not supported');
    return false;
  }

  try {
    // Register service worker
    await registerServiceWorker();

    // Check if already granted permission and subscribed
    if (Notification.permission === 'granted') {
      const isSubscribed = await checkSubscriptionStatus();
      if (!isSubscribed) {
        // User granted permission but not subscribed, subscribe them
        await subscribeToPush();
      }
    }

    return true;
  } catch (error) {
    console.error('Failed to initialize push notifications:', error);
    return false;
  }
}
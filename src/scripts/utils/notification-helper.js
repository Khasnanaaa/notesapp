import { convertBase64ToUint8Array } from './index';
import CONFIG from '../config';
import StoryApi from '../data/story-api';

export function isNotificationAvailable() {
  return 'Notification' in window;
}

export function isNotificationGranted() {
  return Notification.permission === 'granted';
}

export async function requestNotificationPermission() {
  if (!isNotificationAvailable()) {
    console.error('Notification API unsupported.');
    return false;
  }

  if (isNotificationGranted()) {
    return true;
  }

  const status = await Notification.requestPermission();

  if (status === 'denied') {
    window.alert('Izin notifikasi ditolak.');
    return false;
  }

  if (status === 'default') {
    window.alert('Izin notifikasi ditutup atau diabaikan.');
    return false;
  }

  return true;
}

export async function getPushSubscription() {
  const registration = await navigator.serviceWorker.getRegistration();
  return await registration.pushManager.getSubscription();
}

export async function isCurrentPushSubscriptionAvailable() {
  return !!(await getPushSubscription());
}

export function generateSubscribeOptions() {
  return {
    userVisibleOnly: true,
    applicationServerKey: convertBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY),
  };
}

export async function subscribe() {
  if (!(await requestNotificationPermission())) {
    return;
  }

  if (await isCurrentPushSubscriptionAvailable()) {
    window.alert('Sudah berlangganan push notification.');
    return;
  }

  console.log('Mulai berlangganan push notification...');
  const failureSubscribeMessage = 'Langganan push notification gagal diaktifkan.';
  const successSubscribeMessage = 'Langganan push notification berhasil diaktifkan.';
  let pushSubscription;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    pushSubscription = await registration.pushManager.subscribe(generateSubscribeOptions());

    const { endpoint, keys } = pushSubscription.toJSON();
    // Assuming StoryApi has a method that matches or we created a wrapper.
    // The tutorial uses `subscribePushNotification` from `../data/api`. 
    // We will use StoryApi.saveSubscription which seems to exist, or map it.
    // Let's assume StoryApi is adapted.
    const response = await StoryApi.saveSubscription({ endpoint, keys });
    
    // Check if the API response is actually "ok" or if we need to check properties.
    // If StoryApi throws on error, catch block handles it.
    // If it returns object, we assume success unless it has error fields (StoryApi usually throws).
    
    window.alert(successSubscribeMessage);
  } catch (error) {
    console.error('subscribe: error:', error);
    window.alert(failureSubscribeMessage);
    if (pushSubscription) {
        await pushSubscription.unsubscribe();
    }
  }
}

export async function unsubscribe() {
  const failureUnsubscribeMessage = 'Langganan push notification gagal dinonaktifkan.';
  const successUnsubscribeMessage = 'Langganan push notification berhasil dinonaktifkan.';
  try {
    const pushSubscription = await getPushSubscription();
    if (!pushSubscription) {
      window.alert('Tidak bisa memutus langganan push notification karena belum berlangganan sebelumnya.');
      return;
    }
    const { endpoint } = pushSubscription.toJSON();
    
    // Call API to unsubscribe
    await StoryApi.deleteSubscription(endpoint);

    const unsubscribed = await pushSubscription.unsubscribe();
    if (!unsubscribed) {
      window.alert(failureUnsubscribeMessage);
      // Re-subscribe if API succeeded but local failed? (Edge case)
      return;
    }
    window.alert(successUnsubscribeMessage);
  } catch (error) {
    window.alert(failureUnsubscribeMessage);
    console.error('unsubscribe: error:', error);
  }
}

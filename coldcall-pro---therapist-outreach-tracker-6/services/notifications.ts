
import { CallLogEntry } from '../types';

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications.');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const sendNotification = (title: string, options?: NotificationOptions) => {
  if (Notification.permission === 'granted') {
    // Try to use service worker if available for better background support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          icon: 'https://cdn-icons-png.flaticon.com/512/5968/5968841.png',
          badge: 'https://cdn-icons-png.flaticon.com/512/5968/5968841.png',
          ...options,
        });
      });
    } else {
      new Notification(title, options);
    }
  }
};

export const checkReminders = (entries: CallLogEntry[]) => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

  // We only want to notify once per reminder. 
  // We can use localStorage to track which ones we've already notified for today.
  const notifiedKey = `notified_reminders_${todayStr}`;
  const notifiedIds = JSON.parse(localStorage.getItem(notifiedKey) || '[]');

  entries.forEach((entry) => {
    if (entry.followUpDate === todayStr && entry.followUpTime) {
      // If the follow-up time is now or passed, and we haven't notified yet
      if (entry.followUpTime <= currentTime && !notifiedIds.includes(entry.id)) {
        sendNotification(`Follow-up: ${entry.businessName}`, {
          body: `Time: ${entry.followUpTime}\nNote: ${entry.reminderNote || 'No notes'}`,
          tag: entry.id, // Prevent duplicate notifications for the same entry
          requireInteraction: true,
        });
        
        notifiedIds.push(entry.id);
      }
    }
  });

  localStorage.setItem(notifiedKey, JSON.stringify(notifiedIds));
};

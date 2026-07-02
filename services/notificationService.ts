import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const NOTIFICATION_PERMISSION_KEY = 'grimoire_notification_permission_asked';

export interface ScheduledNotification {
  id: string;
  trigger: Notifications.NotificationTriggerInput;
  content: Notifications.NotificationContentInput;
  ritualId?: string;
}

/**
 * Notification Service for managing push and local notifications
 */
export class NotificationService {
  /**
   * Initialize notifications - must be called on app startup
   */
  static async initialize() {
    try {
      // Configure notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Check if already asked for permission
      const hasAskedPermission = await AsyncStorage.getItem(NOTIFICATION_PERMISSION_KEY);

      if (!hasAskedPermission && Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'true');

        if (finalStatus !== 'granted') {
          console.warn('Notification permission not granted');
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return false;
    }
  }

  /**
   * Schedule a ritual reminder notification
   */
  static async scheduleRitualReminder(
    ritualId: string,
    ritualName: string,
    scheduledDate: string,
    minutesBefore: number = 30
  ): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.warn('Notifications only work on physical devices');
        return null;
      }

      const scheduledTime = new Date(scheduledDate);
      const reminderTime = new Date(scheduledTime.getTime() - minutesBefore * 60 * 1000);

      // Don't schedule if time is in the past
      if (reminderTime.getTime() < Date.now()) {
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Ritual Reminder',
          body: `Time to perform: ${ritualName}`,
          data: {
            ritualId,
            screen: 'ritual',
            ritualName,
          },
          sound: 'default',
          badge: 1,
        },
        trigger: {
          type: 'date',
          date: reminderTime,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule ritual reminder:', error);
      return null;
    }
  }

  /**
   * Schedule a daily motivation notification
   */
  static async scheduleDailyMotivation(hour: number = 7, minute: number = 0): Promise<string | null> {
    try {
      if (!Device.isDevice) return null;

      const motivationalMessages = [
        'Your practice awaits. Step into your power today.',
        'Every ritual brings you closer to your dreams.',
        'Today is a perfect day to tend to your spiritual garden.',
        'Your intentions are ripening. Continue your practice.',
        'Feel the magic within you. It\'s time to manifest.',
        'The universe is listening. Perform your ritual today.',
        'Your consistent practice is creating miracles.',
        'Let today be a day of alignment and intention.',
      ];

      const randomMessage = motivationalMessages[
        Math.floor(Math.random() * motivationalMessages.length)
      ];

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Time for Your Practice',
          body: randomMessage,
          data: { screen: 'home' },
          sound: 'default',
          badge: 1,
        },
        trigger: {
          type: 'daily',
          hour,
          minute,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule daily motivation:', error);
      return null;
    }
  }

  /**
   * Send an achievement notification
   */
  static async sendAchievementNotification(
    title: string,
    description: string
  ): Promise<string | null> {
    try {
      if (!Device.isDevice) return null;

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: description,
          data: { screen: 'achievements' },
          sound: 'default',
          badge: 1,
        },
        trigger: { type: 'timeInterval', seconds: 1 },
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to send achievement notification:', error);
      return null;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  static async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  static async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Update a ritual's reminder notification
   */
  static async updateRitualReminder(
    ritualId: string,
    ritualName: string,
    newScheduledDate: string,
    oldNotificationId?: string,
    minutesBefore: number = 30
  ): Promise<string | null> {
    try {
      // Cancel old notification if it exists
      if (oldNotificationId) {
        await this.cancelNotification(oldNotificationId);
      }

      // Schedule new notification
      return await this.scheduleRitualReminder(
        ritualId,
        ritualName,
        newScheduledDate,
        minutesBefore
      );
    } catch (error) {
      console.error('Failed to update ritual reminder:', error);
      return null;
    }
  }

  /**
   * Check if notifications are permitted
   */
  static async checkNotificationPermission(): Promise<boolean> {
    try {
      if (!Device.isDevice) return false;
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Failed to check notification permission:', error);
      return false;
    }
  }

  /**
   * Request notification permission
   */
  static async requestNotificationPermission(): Promise<boolean> {
    try {
      if (!Device.isDevice) return false;

      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'true');
      }
      return status === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  /**
   * Send in-app toast notification
   */
  static async sendToastNotification(
    title: string,
    body: string,
    duration: number = 3000
  ): Promise<void> {
    // This will be handled by the ToastContext
    // This method is a placeholder for consistency
  }
}

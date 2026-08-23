import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { api } from './api.service';

/**
 * Registers this device for push notifications and syncs the FCM token to
 * the backend (PATCH /users/me/push-token).
 *
 * IMPORTANT: this only works once Firebase is actually set up natively for
 * this app — see client/README.md "Push notifications" section. Without
 * that native config, requesting permission / getToken will throw, so every
 * call here is wrapped defensively and just logs instead of crashing the app.
 */
export async function registerForPushNotifications(): Promise<void> {
  try {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      if (!enabled) return;
    }

    const token = await messaging().getToken();
    if (token) {
      await api.patch('/users/me/push-token', { token });
    }

    messaging().onTokenRefresh(async (newToken) => {
      await api.patch('/users/me/push-token', { token: newToken }).catch(() => {});
    });
  } catch (err) {
    console.warn(
      '[push] Registration skipped — Firebase native setup is likely missing. ' +
        'See client/README.md. Error:',
      err,
    );
  }
}

/** Call once near app startup to handle a push tapped while the app was killed/backgrounded. */
export function onNotificationOpenedApp(onChatId: (chatId: string) => void) {
  try {
    messaging().onNotificationOpenedApp((remoteMessage) => {
      const chatId = remoteMessage?.data?.chatId as string | undefined;
      if (chatId) onChatId(chatId);
    });

    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        const chatId = remoteMessage?.data?.chatId as string | undefined;
        if (chatId) onChatId(chatId);
      });
  } catch (err) {
    console.warn('[push] onNotificationOpenedApp skipped:', err);
  }
}

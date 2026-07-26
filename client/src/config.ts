import { Platform } from 'react-native';

// Android emulator maps 10.0.2.2 -> host machine's localhost.
// iOS simulator can use localhost directly. Real devices need your LAN IP.
export const API_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

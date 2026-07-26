import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, View, Text } from 'react-native';
import { useAuthStore } from './src/store/auth.store';
import { useChatStore } from './src/store/chat.store';
import { COLORS } from './src/theme';
import { registerForPushNotifications, onNotificationOpenedApp } from './src/services/push.service';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import ChatScreen from './src/screens/ChatScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import CreateChatScreen from './src/screens/CreateChatScreen';

const Stack = createStackNavigator();

function App() {
  const { isAuthenticated, token, initialize, isLoading } = useAuthStore();
  const { startListening, stopListening } = useChatStore();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (isAuthenticated && token) {
      startListening();
      registerForPushNotifications();
    }
    return () => stopListening();
  }, [isAuthenticated, token]);

  const navigationRef = useRef<any>(null);
  useEffect(() => {
    onNotificationOpenedApp((chatId) => {
      navigationRef.current?.navigate('Chat', { id: chatId });
    });
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bgPrimary }}>
        <Text style={{ color: COLORS.textPrimary, fontSize: 18 }}>Загрузка...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgPrimary} />
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: COLORS.bgPrimary },
            headerTintColor: COLORS.textPrimary,
            headerTitleStyle: { fontWeight: '600' },
            cardStyle: { backgroundColor: COLORS.bgPrimary },
          }}
        >
          {!isAuthenticated ? (
            <>
              <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
            </>
          ) : (
            <>
              <Stack.Screen name="ChatList" component={ChatListScreen} options={{ title: 'Nexus' }} />
              <Stack.Screen
                name="Chat"
                component={ChatScreen}
                options={({ route }: any) => ({ title: route.params?.title || 'Chat' })}
              />
              <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Настройки' }} />
              <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Профиль' }} />
              <Stack.Screen name="CreateChat" component={CreateChatScreen} options={{ title: 'Новый чат' }} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;

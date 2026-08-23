/**
 * Nexus — точка входа мобильного приложения (React Native).
 *
 * Что здесь происходит:
 * 1. Пока проверяется токен — показываем заставку.
 * 2. Если пользователь НЕ авторизован — стек Login/Register.
 * 3. Если авторизован — стек чатов + экран выбора иконки приложения.
 */
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuthStore } from './src/store/auth.store';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import IconPickerScreen from './src/screens/IconPickerScreen';

const Stack = createNativeStackNavigator();

/* Заставка, пока проверяется токен авторизации */
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#dc2626" />
      <Text style={styles.loadingText}>Загрузка Nexus…</Text>
    </View>
  );
}

/* Стек для НЕавторизованных: вход / регистрация */
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

/* Стек для авторизованных: чаты + выбор иконки */
function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0a0a0a' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="ChatList"
        component={ChatListScreen}
        options={({ navigation }) => ({
          title: 'Nexus',
          // Кнопка 🎨 справа в шапке — открывает выбор иконки
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('IconPicker')}
              style={styles.headerButton}
            >
              <Text style={styles.headerButtonText}>🎨</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="IconPicker"
        component={IconPickerScreen}
        options={{ title: 'Иконка приложения' }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const initialize = useAuthStore((s) => s.initialize);

  React.useEffect(() => {
    // Проверяем сохранённый токен при старте (если такая функция есть в сторе)
    if (typeof initialize === 'function') {
      initialize();
    }
  }, [initialize]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  loadingText: {
    marginTop: 12,
    color: '#a1a1aa',
    fontSize: 14,
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerButtonText: {
    fontSize: 20,
  },
});

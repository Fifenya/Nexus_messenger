import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import { useAuthStore } from '../store/auth.store';

export default function LoginScreen({ navigation }: any) {
  const [u, setU] = useState(''); const [p, setP] = useState('');
  const login = useAuthStore(s => s.login);

  const handle = async () => {
    try { await login(u, p); } catch (e: any) { Alert.alert('Ошибка', e?.response?.data?.message || 'Неверные данные'); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Вход в Nexus</Text>
      <TextInput style={styles.input} placeholder="Username" value={u} onChangeText={setU} />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={p} onChangeText={setP} />
      <Button title="Войти" onPress={handle} />
      <Text style={styles.link} onPress={() => navigation.navigate('Register')}>Нет аккаунта? Регистрация</Text>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', padding: 20 }, title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }, input: { borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 }, link: { textAlign: 'center', marginTop: 15, color: 'blue' } });

import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import { useAuthStore } from '../store/auth.store';

export default function RegisterScreen({ navigation }: any) {
  const [u, setU] = useState(''); const [p, setP] = useState('');
  const register = useAuthStore(s => s.register);

  const handle = async () => {
    try { await register(u, p); } catch (e: any) { Alert.alert('Ошибка', e?.response?.data?.message || 'Не удалось'); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Регистрация</Text>
      <TextInput style={styles.input} placeholder="Username" value={u} onChangeText={setU} />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={p} onChangeText={setP} />
      <Button title="Создать" onPress={handle} />
      <Text style={styles.link} onPress={() => navigation.navigate('Login')}>Уже есть аккаунт? Войти</Text>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', padding: 20 }, title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }, input: { borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 }, link: { textAlign: 'center', marginTop: 15, color: 'blue' } });

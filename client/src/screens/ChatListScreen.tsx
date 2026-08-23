import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { api } from '../services/api.service';
import { useAuthStore } from '../store/auth.store';

export default function ChatListScreen() {
  const [chats, setChats] = useState([]);
  const logout = useAuthStore(s => s.logout);

  useEffect(() => { api.get('/chats').then(res => setChats(res.data)).catch(e => Alert.alert('Ошибка загрузки')); }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ваши чаты</Text>
      <FlatList data={chats} keyExtractor={(item: any) => item.id} renderItem={({item}) => (
        <View style={styles.chatItem}><Text>{item.title || 'Чат ' + item.id}</Text></View>
      )} />
      <TouchableOpacity onPress={logout} style={styles.logoutBtn}><Text style={{color:'white'}}>Выйти</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, paddingTop: 50, padding: 20 }, title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 }, chatItem: { padding: 15, borderBottomWidth: 1, borderColor: '#ccc' }, logoutBtn: { marginTop: 20, backgroundColor: 'red', padding: 15, alignItems: 'center', borderRadius: 5 } });

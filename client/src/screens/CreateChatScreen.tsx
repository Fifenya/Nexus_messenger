import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { api } from '../services/api.service';
import { useChatStore } from '../store/chat.store';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../theme';

export default function CreateChatScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const createPrivateChat = useChatStore((s) => s.createPrivateChat);

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data } = await api.get('/users/search', { params: { q: text } });
      setResults(data);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = async (targetUser: any) => {
    const chat = await createPrivateChat(targetUser.id);
    navigation.replace('Chat', { id: chat.id, title: targetUser.displayName || targetUser.username });
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Найти пользователя по имени"
        placeholderTextColor={COLORS.textMuted}
        value={query}
        onChangeText={handleSearch}
        autoCapitalize="none"
        autoFocus
      />

      {searching && <ActivityIndicator style={{ marginTop: SPACING.md }} color={COLORS.accent} />}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: SPACING.md }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.userRow} onPress={() => handleSelect(item)}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{item.username.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.userName}>{item.displayName || item.username}</Text>
              <Text style={styles.userHandle}>@{item.username}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !searching && query.length >= 2 ? (
            <Text style={styles.emptyText}>Никого не найдено</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary, padding: SPACING.md },
  input: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: FONTS.regular,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.accentMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  userName: { color: COLORS.textPrimary, fontSize: 16, fontFamily: FONTS.semibold },
  userHandle: { color: COLORS.textMuted, fontSize: 13, marginTop: 2 },
  emptyText: { color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.xl },
});

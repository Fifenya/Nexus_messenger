import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAuthStore } from '../store/auth.store';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../theme';

export default function SettingsScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Выйти', 'Вы уверены, что хотите выйти из аккаунта?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Profile')}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{user?.username?.charAt(0).toUpperCase() || '?'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{user?.displayName || user?.username}</Text>
          <Text style={styles.username}>@{user?.username}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Аккаунт</Text>
        <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.itemText}>Редактировать профиль</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Выйти из аккаунта</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  content: { padding: SPACING.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.accentMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#FFF', fontSize: 22, fontWeight: '600' },
  name: { color: COLORS.textPrimary, fontSize: 18, fontFamily: FONTS.semibold },
  username: { color: COLORS.textSecondary, fontSize: 14, marginTop: 2 },
  section: { marginBottom: SPACING.lg },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  item: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  itemText: { color: COLORS.textPrimary, fontSize: 16 },
  logoutButton: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  logoutText: { color: COLORS.danger, fontSize: 16, fontWeight: '600' },
});

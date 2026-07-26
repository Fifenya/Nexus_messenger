import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { api } from '../services/api.service';
import { useAuthStore } from '../store/auth.store';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../theme';

export default function ProfileScreen() {
  const { user } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/users/me', { displayName, bio });
      Alert.alert('Готово', 'Профиль обновлён');
    } catch (error: any) {
      Alert.alert('Ошибка', error.response?.data?.message || 'Не удалось сохранить профиль');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>{user?.username?.charAt(0).toUpperCase() || '?'}</Text>
      </View>
      <Text style={styles.username}>@{user?.username}</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Отображаемое имя</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Как вас видят другие"
          placeholderTextColor={COLORS.textMuted}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>О себе</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          value={bio}
          onChangeText={setBio}
          placeholder="Пара слов о себе"
          placeholderTextColor={COLORS.textMuted}
          multiline
          maxLength={160}
        />
      </View>

      <TouchableOpacity style={[styles.button, saving && styles.buttonDisabled]} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Сохранить</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary, padding: SPACING.lg, alignItems: 'center' },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.accentMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  avatarText: { color: '#FFF', fontSize: 32, fontWeight: '600' },
  username: { color: COLORS.textSecondary, fontSize: 16, marginTop: SPACING.sm, marginBottom: SPACING.xl },
  field: { width: '100%', marginBottom: SPACING.md },
  label: { color: COLORS.textMuted, fontSize: 13, marginBottom: SPACING.xs },
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
  bioInput: { minHeight: 80, textAlignVertical: 'top' },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    width: '100%',
    marginTop: SPACING.md,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});

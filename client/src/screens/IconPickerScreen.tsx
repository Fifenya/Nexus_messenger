import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { AVAILABLE_ICONS } from '../config/icons.generated';
import { useIconStore } from '../store/icon.store';

export default function IconPickerScreen() {
  const currentIcon = useIconStore((s) => s.currentIcon);
  const setIcon = useIconStore((s) => s.setIcon);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      <Text style={styles.title}>Иконка приложения</Text>
      <Text style={styles.subtitle}>
        Как в Telegram — выбери стиль иконки на рабочем столе
      </Text>

      <ScrollView contentContainerStyle={styles.grid}>
        {AVAILABLE_ICONS.map((icon) => (
          <TouchableOpacity
            key={icon.id}
            style={[styles.cell, currentIcon === icon.id && styles.cellActive]}
            onPress={() => setIcon(icon.id)}
          >
            <Image source={icon.preview} style={styles.preview} />
            <Text style={styles.name}>{icon.name}</Text>
            {currentIcon === icon.id && <Text style={styles.check}>✓</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingTop: 16 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { color: '#a1a1aa', fontSize: 13, textAlign: 'center', marginBottom: 24, paddingHorizontal: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingBottom: 32 },
  cell: {
    width: 100,
    margin: 8,
    alignItems: 'center',
    padding: 10,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#1a1a1a',
  },
  cellActive: { borderColor: '#dc2626' },
  preview: { width: 72, height: 72, borderRadius: 16 },
  name: { color: '#fff', fontSize: 12, marginTop: 8, textAlign: 'center' },
  check: { color: '#dc2626', fontSize: 14, fontWeight: 'bold', marginTop: 2 },
});

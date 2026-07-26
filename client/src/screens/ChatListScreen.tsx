import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuthStore } from '../store/auth.store';
import { useChatStore } from '../store/chat.store';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../theme';

export default function ChatListScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { chats, loading, fetchChats, setActiveChat } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchChats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchChats();
    setRefreshing(false);
  };

  const handleChatPress = (chat: any) => {
    setActiveChat(chat.id);
    const otherMember = chat.members?.find((m: any) => m.userId !== user?.id);
    const title = chat.type === 'PRIVATE'
      ? otherMember?.user?.displayName || otherMember?.user?.username || 'Chat'
      : chat.title || 'Group Chat';
    
    navigation.navigate('Chat', {
      id: chat.id,
      title,
    });
  };

  const renderChatItem = ({ item }: any) => {
    const isGroup = item.type === 'GROUP';
    const otherMember = item.members?.find((m: any) => m.userId !== user?.id);
    const displayName = isGroup
      ? item.title
      : otherMember?.user?.displayName || otherMember?.user?.username || 'Unknown';
    const avatarUrl = isGroup ? item.avatarUrl : otherMember?.user?.avatarUrl;
    const lastMessage = item.messages?.[0];
    const isOnline = otherMember?.user?.onlineStatus === 'online';

    return (
      <TouchableOpacity style={styles.chatItem} onPress={() => handleChatPress(item)}>
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {displayName?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
          {isOnline && !isGroup && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.chatInfo}>
          <Text style={styles.chatName} numberOfLines={1}>
            {displayName}
          </Text>
          {lastMessage && (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {lastMessage.isDeleted ? 'Сообщение удалено' : lastMessage.text || 'Медиа'}
            </Text>
          )}
        </View>

        <View style={styles.chatMeta}>
          {lastMessage && (
            <Text style={styles.timestamp}>
              {new Date(lastMessage.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          )}
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const filteredChats = searchQuery
    ? chats.filter((chat) => {
        const otherMember = chat.members?.find((m: any) => m.userId !== user?.id);
        const displayName = chat.type === 'PRIVATE'
          ? otherMember?.user?.displayName || otherMember?.user?.username || ''
          : chat.title || '';
        return displayName.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : chats;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск чатов..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={styles.newChatButton}
          onPress={() => navigation.navigate('CreateChat')}
        >
          <Text style={styles.newChatText}>+</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Нет чатов</Text>
              <Text style={styles.emptySubtext}>Начните новый чат</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.bgSecondary,
    gap: SPACING.md,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  newChatButton: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newChatText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: SPACING.xs,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bgPrimary,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.full,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '600',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.bgPrimary,
  },
  chatInfo: {
    flex: 1,
    gap: 4,
  },
  chatName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.semibold,
  },
  lastMessage: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  chatMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  timestamp: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  unreadBadge: {
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 18,
    fontFamily: FONTS.semibold,
  },
  emptySubtext: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginTop: SPACING.xs,
  },
});
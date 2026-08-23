import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useChatStore } from '../store/chat.store';
import { useAuthStore } from '../store/auth.store';
import { socketService } from '../services/socket.service';
import { pickAndUploadMedia, captureAndUploadMedia, uploadLocalFile, UploadedAttachment } from '../services/media.service';
import { audioService } from '../services/audio.service';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../theme';

export default function ChatScreen({ route }: any) {
  const { id: chatId, title } = route.params;
  const { user } = useAuthStore();
  const { chats, fetchMessages, sendMessage, addReaction, editMessage, deleteMessage } = useChatStore();
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [editingMessage, setEditingMessage] = useState<any | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const chat = chats.find((c) => c.id === chatId);
  const messages = chat?.messages || [];

  useEffect(() => {
    if (chatId) fetchMessages(chatId);
  }, [chatId]);

  useEffect(() => () => audioService.cleanup(), []);

  const resetComposer = () => {
    setMessageText('');
    setReplyingTo(null);
    setEditingMessage(null);
  };

  const handleSend = async () => {
    if (!messageText.trim()) return;

    if (editingMessage) {
      editMessage(chatId, editingMessage.id, messageText.trim());
      resetComposer();
      return;
    }

    setLoading(true);
    try {
      sendMessage(chatId, messageText.trim(), replyingTo?.id);
      resetComposer();
      socketService.sendTyping(chatId, false);
      setTyping(false);
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось отправить сообщение');
    } finally {
      setLoading(false);
    }
  };

  const handleTyping = (text: string) => {
    setMessageText(text);
    if (text.length > 0 && !typing) {
      setTyping(true);
      socketService.sendTyping(chatId, true);
    } else if (text.length === 0 && typing) {
      setTyping(false);
      socketService.sendTyping(chatId, false);
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    addReaction(messageId, emoji);
    socketService.sendReaction(messageId, emoji);
  };

  const sendAttachment = (attachment: UploadedAttachment | null) => {
    if (!attachment) return;
    sendMessage(chatId, '', replyingTo?.id, [attachment]);
    setReplyingTo(null);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const handleAttach = () => {
    Alert.alert('Прикрепить', undefined, [
      {
        text: '📷 Камера',
        onPress: async () => {
          setUploading(true);
          try {
            sendAttachment(await captureAndUploadMedia('photo'));
          } catch {
            Alert.alert('Ошибка', 'Не удалось загрузить фото');
          } finally {
            setUploading(false);
          }
        },
      },
      {
        text: '🖼️ Галерея (фото/видео)',
        onPress: async () => {
          setUploading(true);
          try {
            sendAttachment(await pickAndUploadMedia('mixed'));
          } catch {
            Alert.alert('Ошибка', 'Не удалось загрузить файл');
          } finally {
            setUploading(false);
          }
        },
      },
      { text: 'Отмена', style: 'cancel' },
    ]);
  };

  const handleVoicePressIn = async () => {
    setIsRecording(true);
    setRecordSeconds(0);
    audioService.onRecordProgress(setRecordSeconds);
    await audioService.startRecording();
  };

  const handleVoicePressOut = async () => {
    setIsRecording(false);
    try {
      const { uri } = await audioService.stopRecording();
      if (recordSeconds < 1) return; // too short, likely an accidental tap
      setUploading(true);
      const attachment = await uploadLocalFile(uri, `voice_${Date.now()}.m4a`, 'audio/m4a');
      sendMessage(chatId, '', replyingTo?.id, [{ ...attachment, duration: recordSeconds }]);
      setReplyingTo(null);
    } catch {
      Alert.alert('Ошибка', 'Не удалось отправить голосовое сообщение');
    } finally {
      setUploading(false);
    }
  };

  const handleLongPress = (item: any) => {
    const isOwn = item.senderId === user?.id;
    const options: any[] = [{ text: 'Ответить', onPress: () => setReplyingTo(item) }];
    if (isOwn && !item.isDeleted) {
      if (item.text) {
        options.push({
          text: 'Редактировать',
          onPress: () => {
            setEditingMessage(item);
            setMessageText(item.text || '');
          },
        });
      }
      options.push({
        text: 'Удалить',
        style: 'destructive',
        onPress: () => deleteMessage(chatId, item.id),
      });
    }
    options.push({ text: 'Отмена', style: 'cancel' });
    Alert.alert('Сообщение', undefined, options);
  };

  const renderAttachment = (attachment: any) => {
    if (attachment.type === 'image') {
      return (
        <Image
          source={{ uri: attachment.url }}
          style={styles.attachmentImage}
          resizeMode="cover"
        />
      );
    }
    if (attachment.type === 'video') {
      return (
        <View style={styles.videoPlaceholder}>
          <Text style={styles.videoIcon}>▶</Text>
          <Text style={styles.videoLabel}>Видео</Text>
        </View>
      );
    }
    if (attachment.type === 'voice') {
      return (
        <TouchableOpacity
          style={styles.voiceRow}
          onPress={() => audioService.playFromUrl(attachment.url)}
        >
          <Text style={styles.voiceIcon}>▶</Text>
          <View style={styles.voiceWave} />
          <Text style={styles.voiceDuration}>
            {attachment.duration ? `${attachment.duration}s` : 'голосовое'}
          </Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const renderMessage = ({ item }: any) => {
    const isOwn = item.senderId === user?.id;
    const sender = item.sender;
    const replySnippet = item.replyToId
      ? messages.find((m: any) => m.id === item.replyToId)
      : null;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onLongPress={() => !item.isDeleted && handleLongPress(item)}
        style={[styles.messageWrapper, isOwn ? styles.messageOwnWrapper : styles.messageOtherWrapper]}
      >
        <View style={[styles.messageBubble, isOwn ? styles.messageOwn : styles.messageOther]}>
          {!isOwn && sender && <Text style={styles.messageSender}>{sender.displayName || sender.username}</Text>}

          {replySnippet && (
            <View style={styles.replyPreview}>
              <Text style={styles.replyPreviewText} numberOfLines={1}>
                {replySnippet.isDeleted ? 'Сообщение удалено' : replySnippet.text || '📎 Вложение'}
              </Text>
            </View>
          )}

          {item.attachments?.map((a: any) => <View key={a.id}>{renderAttachment(a)}</View>)}

          {item.text ? (
            <Text style={styles.messageText}>{item.isDeleted ? 'Сообщение удалено' : item.text}</Text>
          ) : null}

          <View style={styles.metaRow}>
            {item.editedAt && !item.isDeleted && <Text style={styles.editedLabel}>изменено</Text>}
            <Text style={styles.messageTime}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        {!item.isDeleted && (
          <View style={styles.reactionsContainer}>
            {item.reactions?.map((r: any, i: number) => (
              <TouchableOpacity key={i} style={styles.reactionBadge} onPress={() => handleReaction(item.id, r.emoji)}>
                <Text style={styles.reactionEmoji}>{r.emoji}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.addReactionButton}
              onPress={() =>
                Alert.alert('Реакция', 'Выберите эмодзи', [
                  { text: '❤️', onPress: () => handleReaction(item.id, '❤️') },
                  { text: '👍', onPress: () => handleReaction(item.id, '👍') },
                  { text: '😂', onPress: () => handleReaction(item.id, '😂') },
                  { text: '😮', onPress: () => handleReaction(item.id, '😮') },
                  { text: '😢', onPress: () => handleReaction(item.id, '😢') },
                  { text: '🔥', onPress: () => handleReaction(item.id, '🔥') },
                ])
              }
            >
              <Text style={styles.addReactionText}>+</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        inverted
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyMessages}>
            <Text style={styles.emptyText}>Нет сообщений</Text>
            <Text style={styles.emptySubtext}>Начните общение</Text>
          </View>
        }
      />

      {(replyingTo || editingMessage) && (
        <View style={styles.composerBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.composerBannerLabel}>
              {editingMessage ? 'Редактирование' : `Ответ ${replyingTo?.sender?.displayName || replyingTo?.sender?.username || ''}`}
            </Text>
            <Text style={styles.composerBannerText} numberOfLines={1}>
              {(editingMessage || replyingTo)?.text || '📎 Вложение'}
            </Text>
          </View>
          <TouchableOpacity onPress={resetComposer}>
            <Text style={styles.composerBannerClose}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.iconButton} onPress={handleAttach} disabled={uploading || isRecording}>
          {uploading ? <ActivityIndicator size="small" color={COLORS.accent} /> : <Text style={styles.iconText}>📎</Text>}
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Сообщение..."
          placeholderTextColor={COLORS.textMuted}
          value={messageText}
          onChangeText={handleTyping}
          multiline
          maxLength={1000}
          editable={!isRecording}
        />

        {messageText.trim() ? (
          <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={loading}>
            {loading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.sendButtonText}>➤</Text>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.sendButton, isRecording && styles.recordingButton]}
            onPressIn={handleVoicePressIn}
            onPressOut={handleVoicePressOut}
          >
            <Text style={styles.sendButtonText}>{isRecording ? `${recordSeconds}s` : '🎤'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  messagesList: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, flexGrow: 1 },
  messageWrapper: { marginBottom: SPACING.md },
  messageOwnWrapper: { alignItems: 'flex-end' },
  messageOtherWrapper: { alignItems: 'flex-start' },
  messageBubble: { maxWidth: '80%', padding: SPACING.md, borderRadius: BORDER_RADIUS.lg },
  messageOwn: { backgroundColor: COLORS.messageOwn, borderBottomRightRadius: 4 },
  messageOther: { backgroundColor: COLORS.messageOther, borderBottomLeftRadius: 4 },
  messageSender: { color: COLORS.textSecondary, fontSize: 12, fontFamily: FONTS.medium, marginBottom: 4 },
  replyPreview: {
    borderLeftWidth: 2,
    borderLeftColor: COLORS.accent,
    paddingLeft: SPACING.sm,
    marginBottom: SPACING.xs,
    opacity: 0.8,
  },
  replyPreviewText: { color: COLORS.textSecondary, fontSize: 13 },
  messageText: { color: COLORS.textPrimary, fontSize: 16, fontFamily: FONTS.regular },
  metaRow: { flexDirection: 'row', alignSelf: 'flex-end', marginTop: 4, gap: 6 },
  editedLabel: { color: COLORS.textMuted, fontSize: 10, fontStyle: 'italic' },
  messageTime: { color: COLORS.textMuted, fontSize: 10, fontFamily: FONTS.regular },
  attachmentImage: { width: 200, height: 200, borderRadius: BORDER_RADIUS.sm, marginBottom: SPACING.xs },
  videoPlaceholder: {
    width: 200,
    height: 140,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  videoIcon: { fontSize: 32, color: COLORS.textPrimary },
  videoLabel: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.bgPrimary,
    borderRadius: BORDER_RADIUS.full,
    padding: SPACING.sm,
    minWidth: 160,
  },
  voiceIcon: { color: COLORS.accent, fontSize: 16 },
  voiceWave: { flex: 1, height: 2, backgroundColor: COLORS.border },
  voiceDuration: { color: COLORS.textMuted, fontSize: 12 },
  reactionsContainer: { flexDirection: 'row', marginTop: 4, gap: 4 },
  reactionBadge: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reactionEmoji: { fontSize: 16 },
  addReactionButton: {
    width: 24,
    height: 24,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.bgSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addReactionText: { color: COLORS.textMuted, fontSize: 14 },
  composerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSecondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  composerBannerLabel: { color: COLORS.accent, fontSize: 12, fontFamily: FONTS.semibold },
  composerBannerText: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  composerBannerClose: { color: COLORS.textMuted, fontSize: 18, paddingHorizontal: SPACING.xs },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  iconButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  iconText: { fontSize: 22 },
  input: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: FONTS.regular,
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingButton: { backgroundColor: COLORS.danger },
  sendButtonText: { color: '#FFF', fontSize: 16 },
  emptyMessages: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: SPACING.xxl * 2 },
  emptyText: { color: COLORS.textSecondary, fontSize: 18, fontFamily: FONTS.semibold },
  emptySubtext: { color: COLORS.textMuted, fontSize: 14, fontFamily: FONTS.regular, marginTop: SPACING.xs },
});

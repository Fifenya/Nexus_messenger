import { create } from 'zustand';
import { api } from '../services/api.service';
import { socketService } from '../services/socket.service';

interface ChatState {
  chats: any[];
  activeChatId: string | null;
  loading: boolean;
  typingUsers: Record<string, string[]>;
  fetchChats: () => Promise<void>;
  setActiveChat: (chatId: string) => void;
  fetchMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, text: string, replyToId?: string, attachments?: any[]) => void;
  editMessage: (chatId: string, messageId: string, text: string) => void;
  deleteMessage: (chatId: string, messageId: string) => void;
  addReaction: (messageId: string, emoji: string) => void;
  startListening: () => void;
  stopListening: () => void;
  createPrivateChat: (otherUserId: string) => Promise<any>;
}

// Normalizes backend chat shape (lastMessage) into `messages: [x]`,
// which is what the chat list preview and ChatScreen were built against.
function normalizeChat(chat: any) {
  return { ...chat, messages: chat.lastMessage ? [chat.lastMessage] : [] };
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeChatId: null,
  loading: false,
  typingUsers: {},

  fetchChats: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/chats');
      set({ chats: data.map(normalizeChat) });
    } finally {
      set({ loading: false });
    }
  },

  setActiveChat: (chatId: string) => {
    set({ activeChatId: chatId });
    socketService.joinChat(chatId);
  },

  fetchMessages: async (chatId: string) => {
    // Backend returns oldest -> newest; ChatScreen's FlatList is
    // `inverted`, which expects newest -> oldest, hence the reverse.
    const { data } = await api.get(`/chats/${chatId}/messages`);
    const descending = [...data].reverse();
    set((state) => ({
      chats: state.chats.map((c) => (c.id === chatId ? { ...c, messages: descending } : c)),
    }));
  },

  sendMessage: (chatId: string, text: string, replyToId?: string, attachments?: any[]) => {
    socketService.sendMessage(chatId, text, replyToId, attachments);
  },

  editMessage: (chatId: string, messageId: string, text: string) => {
    socketService.editMessage(chatId, messageId, text);
  },

  deleteMessage: (chatId: string, messageId: string) => {
    socketService.deleteMessage(chatId, messageId);
  },

  // Actual toggle happens over the socket (see socketService.sendReaction,
  // already called by ChatScreen) — kept as a no-op here so the store's
  // public API matches what the screen expects without double-toggling.
  addReaction: () => {},

  createPrivateChat: async (otherUserId: string) => {
    const { data } = await api.post('/chats', { type: 'PRIVATE', memberIds: [otherUserId] });
    const normalized = normalizeChat(data);
    set((state) => ({
      chats: [normalized, ...state.chats.filter((c) => c.id !== data.id)],
    }));
    return normalized;
  },

  startListening: () => {
    const socket = socketService.instance;
    if (!socket) return;

    socket.on('message:new', (message: any) => {
      set((state) => ({
        chats: state.chats
          .map((c) =>
            c.id === message.chatId
              ? { ...c, messages: [message, ...(c.messages ?? [])], lastMessage: message }
              : c,
          )
          .sort((a, b) => (a.id === message.chatId ? -1 : b.id === message.chatId ? 1 : 0)),
      }));
    });

    socket.on('message:updated', (message: any) => {
      set((state) => ({
        chats: state.chats.map((c) =>
          c.id === message.chatId
            ? { ...c, messages: (c.messages ?? []).map((m: any) => (m.id === message.id ? message : m)) }
            : c,
        ),
      }));
    });

    socket.on('message:deleted', ({ id, chatId }: { id: string; chatId: string }) => {
      set((state) => ({
        chats: state.chats.map((c) =>
          c.id === chatId
            ? { ...c, messages: (c.messages ?? []).map((m: any) => (m.id === id ? { ...m, isDeleted: true, text: null } : m)) }
            : c,
        ),
      }));
    });

    socket.on('message:reaction', ({ chatId, messageId, emoji, userId, toggled }: any) => {
      set((state) => ({
        chats: state.chats.map((c) => {
          if (c.id !== chatId) return c;
          return {
            ...c,
            messages: (c.messages ?? []).map((m: any) => {
              if (m.id !== messageId) return m;
              const reactions = m.reactions ?? [];
              const next =
                toggled === 'on'
                  ? [...reactions, { emoji, userId }]
                  : reactions.filter((r: any) => !(r.emoji === emoji && r.userId === userId));
              return { ...m, reactions: next };
            }),
          };
        }),
      }));
    });

    socket.on('typing:update', ({ chatId, userId, isTyping }: any) => {
      set((state) => {
        const current = state.typingUsers[chatId] ?? [];
        const next = isTyping
          ? Array.from(new Set([...current, userId]))
          : current.filter((id) => id !== userId);
        return { typingUsers: { ...state.typingUsers, [chatId]: next } };
      });
    });
  },

  stopListening: () => {
    const socket = socketService.instance;
    socket?.off('message:new');
    socket?.off('message:updated');
    socket?.off('message:deleted');
    socket?.off('message:reaction');
    socket?.off('typing:update');
  },
}));

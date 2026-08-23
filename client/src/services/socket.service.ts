import { io, Socket } from 'socket.io-client';
import { API_URL } from '../config';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    if (this.socket?.connected) return this.socket;

    this.socket = io(API_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    return this.socket;
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  get instance() {
    return this.socket;
  }

  sendMessage(chatId: string, text: string, replyToId?: string, attachments?: any[]) {
    this.socket?.emit('message:send', { chatId, text, replyToId, attachments });
  }

  editMessage(chatId: string, messageId: string, text: string) {
    this.socket?.emit('message:edit', { chatId, messageId, text });
  }

  deleteMessage(chatId: string, messageId: string) {
    this.socket?.emit('message:delete', { chatId, messageId });
  }

  startTyping(chatId: string) {
    this.socket?.emit('typing:start', { chatId });
  }

  stopTyping(chatId: string) {
    this.socket?.emit('typing:stop', { chatId });
  }

  // Convenience wrapper used by ChatScreen
  sendTyping(chatId: string, isTyping: boolean) {
    this.socket?.emit(isTyping ? 'typing:start' : 'typing:stop', { chatId });
  }

  // Server looks up the message's chat itself, so no chatId needed here.
  sendReaction(messageId: string, emoji: string) {
    this.socket?.emit('message:react', { messageId, emoji });
  }

  joinChat(chatId: string) {
    this.socket?.emit('chat:join', { chatId });
  }
}

export const socketService = new SocketService();

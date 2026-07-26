// User
export interface User {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  onlineStatus?: 'online' | 'offline' | 'invisible';
  lastSeen?: Date;
  createdAt: Date;
}

// Chat
export interface Chat {
  id: string;
  type: 'PRIVATE' | 'GROUP';
  title?: string;
  avatarUrl?: string;
  members: ChatMember[];
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMember {
  id: string;
  userId: string;
  user?: User;
  chatId: string;
  role: 'MEMBER' | 'ADMIN' | 'CREATOR';
  joinedAt: Date;
}

// Message
export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  sender?: User;
  text?: string;
  replyToId?: string;
  replyTo?: Message;
  editedAt?: Date;
  deletedAt?: Date;
  deleteTimer?: number;
  isDeleted: boolean;
  reactions: MessageReaction[];
  attachments: MessageAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  user?: User;
  emoji: string;
  createdAt: Date;
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'NEXUSMOTE';
  url: string;
  size?: number;
  mimeType?: string;
  createdAt: Date;
}

// NexusMote (Sticker)
export interface NexusMote {
  id: string;
  name: string;
  url: string;
  tags: string;
  width?: number;
  height?: number;
  ownerId: string;
  owner?: User;
  createdAt: Date;
  updatedAt: Date;
}

// Bot
export interface Bot {
  id: string;
  token: string;
  name: string;
  username: string;
  description?: string;
  avatarUrl?: string;
  ownerId: string;
  owner?: User;
  webhookUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Invite Link
export interface InviteLink {
  id: string;
  code: string;
  chatId: string;
  chat?: Chat;
  creatorId: string;
  creator?: User;
  uses: number;
  maxUses?: number;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Privacy
export interface PrivacySettings {
  phoneVisibility: 'EVERYONE' | 'CONTACTS' | 'NOBODY';
  forwardRestriction: boolean;
  autoDeleteTimer: number;
  lastSeen: 'EVERYONE' | 'CONTACTS' | 'NOBODY';
  profilePhoto: 'EVERYONE' | 'CONTACTS' | 'NOBODY';
  onlineStatus: 'EVERYONE' | 'CONTACTS' | 'NOBODY';
}

// Theme
export interface Theme {
  id: string;
  name: string;
  authorId?: string;
  author?: User;
  isDefault: boolean;
  isPublic: boolean;
  variables: Record<string, string>;
  colors: Record<string, string>;
  wallpaperUrl?: string;
  downloads: number;
  createdAt: Date;
  updatedAt: Date;
}

// API Response
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
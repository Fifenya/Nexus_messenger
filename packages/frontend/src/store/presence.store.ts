import { create } from 'zustand';
import { getSocket } from '../lib/socket';
import { formatLastSeen } from '../lib/time';

interface PresenceState {
  online: Set<string>;
  lastSeen: Record<string, string>;
  subscribe: () => () => void;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  online: new Set(),
  lastSeen: {},
  subscribe: () => {
    const socket = getSocket();
    if (!socket) return () => {};

    const onPresence = (data: { userId: string; status: 'online' | 'offline'; lastSeenAt?: string | null }) => {
      set((state) => {
        const online = new Set(state.online);
        const lastSeen = { ...state.lastSeen };
        if ((data as any).hidden) {
          online.delete(data.userId);
          lastSeen[data.userId] = null as any;
          return { online, lastSeen };
        }
        if (data.status === 'online') {
          online.add(data.userId);
          delete lastSeen[data.userId];
        } else {
          online.delete(data.userId);
          if (data.lastSeenAt) lastSeen[data.userId] = data.lastSeenAt;
        }
        return { online, lastSeen };
      });
    };

    socket.on('presence:update', onPresence);
    return () => { socket.off('presence:update', onPresence); };
  },
}));

export function useUserPresence(userId?: string) {
  const online = usePresenceStore((s) => userId && s.online.has(userId));
  const lastSeenAt = usePresenceStore((s) => (userId && s.lastSeen[userId]) || null);
  return { online: !!online, lastSeenText: lastSeenAt ? formatLastSeen(lastSeenAt) : null };
}

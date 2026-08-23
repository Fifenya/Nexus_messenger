import { useEffect } from 'react';
import { socket } from '../lib/socket';
import { useAuthStore } from '../store/auth.store';

interface PresenceUpdate {
  userId: string;
  status: 'online' | 'offline';
  lastSeenAt?: string;
}

export function usePresence() {
  const user = useAuthStore(s => s.user);

  useEffect(() => {
    if (!user) return;

    const handleUpdate = (data: PresenceUpdate) => {
      // Можно обновлять store или триггерить refetch
      // Для простоты: перезагружаем страницу (или можно обновить React Query кэш)
      if (data.status === 'offline' && data.lastSeenAt) {
        // Форсируем обновление данных
        window.dispatchEvent(new CustomEvent('presence-update', { detail: data }));
      }
    };

    socket.on('presence:update', handleUpdate);
    return () => {
      socket.off('presence:update', handleUpdate);
    };
  }, [user]);
}

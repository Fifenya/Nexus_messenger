import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import ChatSidebar from '../components/ChatSidebar';
import BottomNav from '../components/BottomNav';
import { Logo, Avatar } from '../components/ui';
import { api } from '../utils/api';
import { useAuthStore } from '../store/auth.store';

export default function ChatListPage() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const [motesChat, setMotesChat] = useState<any>(null);

  useEffect(() => {
    api.get('/motes/chat').then(r => setMotesChat(r.data)).catch(() => {});
  }, []);

  return (
    <div className="h-[100dvh] flex">
      <ChatSidebar />
      <div className="flex-1 flex flex-col items-center justify-center gap-4 chat-wallpaper pb-16 lg:pb-0">
        {motesChat && (
          <button className="btn-accent !rounded-2xl px-6 py-4 flex items-center gap-3 text-lg font-bold" onClick={() => navigate(`/chat/${motesChat.id}`)}>
            <Sparkles size={24} /> Моты
          </button>
        )}
        <Logo size={72} />
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Выбери чат, чтобы начать общение</p>
      </div>
      <BottomNav />
    </div>
  );
}

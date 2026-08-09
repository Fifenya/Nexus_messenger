import React from 'react';
import ChatSidebar from '../components/ChatSidebar';
import BottomNav from '../components/BottomNav';
import { Logo } from '../components/ui';

export default function ChatListPage() {
  return (
    <div className="h-[100dvh] flex">
      <ChatSidebar />
      <div className="flex-1 hidden lg:flex flex-col items-center justify-center gap-4 chat-wallpaper">
        <Logo size={72} />
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Выбери чат, чтобы начать общение</p>
      </div>
      <BottomNav />
    </div>
  );
}

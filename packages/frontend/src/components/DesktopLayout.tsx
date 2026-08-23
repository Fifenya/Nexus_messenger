import React from 'react';
import { useLocation } from 'react-router-dom';
import ChatSidebar from './ChatSidebar';
import BottomNav from './BottomNav';

interface DesktopLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export default function DesktopLayout({ children, showSidebar = true }: DesktopLayoutProps) {
  const location = useLocation();
  const isChat = location.pathname.startsWith('/chat/');
  const isHome = location.pathname === '/';
  
  // На мобильном показываем только children
  // На десктопе — сайдбар + children
  return (
    <div className="h-[100dvh] flex">
      {showSidebar && (isHome || isChat) && (
        <div className="hidden lg:block h-full">
          <ChatSidebar activeId={isChat ? location.pathname.split('/')[2] : undefined} />
        </div>
      )}
      <main className="flex-1 flex flex-col h-full min-w-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

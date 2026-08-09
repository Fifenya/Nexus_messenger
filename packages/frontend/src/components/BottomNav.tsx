import React from 'react';
import { NavLink } from 'react-router-dom';
import { MessageSquare, Settings, User as UserIcon, Users } from 'lucide-react';

const tabs = [
  { to: '/', icon: MessageSquare, label: 'Чаты' },
  { to: '/contacts', icon: Users, label: 'Контакты' },
  { to: '/settings', icon: Settings, label: 'Настройки' },
  { to: '/me', icon: UserIcon, label: 'Профиль' },
];

export default function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex border-t"
      style={{ background: 'var(--color-background-secondary)', borderColor: 'var(--color-border)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {tabs.map(t => (
        <NavLink key={t.to} to={t.to} end={t.to === '/'}
          className="flex-1 flex flex-col items-center gap-1 py-2 text-[11px] font-semibold transition-colors"
          style={({ isActive }) => ({ color: isActive ? 'var(--color-accent-hover)' : 'var(--color-text-muted)' })}>
          <t.icon size={20} />
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}

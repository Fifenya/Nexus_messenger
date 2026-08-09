import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Settings, Plus, Users } from 'lucide-react';
import { api } from '../utils/api';
import { useAuthStore } from '../store/auth.store';
import { Avatar, Logo, fmtListTime } from './ui';

export default function ChatSidebar({ activeId }: { activeId?: string }) {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const [chats, setChats] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  const fetchChats = () => api.get('/chats').then(r => setChats(r.data)).catch(console.error);
  useEffect(() => { fetchChats(); }, []);

  useEffect(() => {
    if (!q.trim()) { setUsers([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await api.get(`/users/search?q=${q}`);
        setUsers(r.data.filter((u: any) => u.id !== user?.id));
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const peer = (c: any) => c.type === 'PRIVATE'
    ? c.members?.map((m: any) => m.user).find((u: any) => u && u.id !== user?.id)
    : null;
  const title = (c: any) => c.title || peer(c)?.displayName || peer(c)?.username || 'Чат';

  const startChat = async (memberId: string) => {
    try {
      const r = await api.post('/chats', { type: 'PRIVATE', memberIds: [memberId] });
      setQ('');
      if (r.data?.id) navigate(`/chat/${r.data.id}`);
      fetchChats();
    } catch (e) { console.error(e); }
  };

  return (
    <aside className="w-full lg:w-[380px] lg:border-r h-full flex flex-col relative"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-background-secondary)' }}>

      {/* Шапка */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <Logo size={34} />
        <span className="text-lg font-extrabold tracking-tight">Nexus</span>
        <div className="flex-1" />
        <button className="icon-btn" onClick={() => navigate('/settings')} title="Настройки">
          <Settings size={20} />
        </button>
      </div>

      {/* Поиск */}
      <div className="px-3 pb-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--color-text-muted)' }} />
          <input ref={searchRef} className="nexus-input pl-10" placeholder="Поиск людей и чатов"
            value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>

      {/* Список */}
      <div className="flex-1 overflow-y-auto pb-28">
        {q.trim() && users.length > 0 && (
          <>
            <div className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--color-text-muted)' }}>Глобальный поиск</div>
            {(Array.isArray(users) ? users : []).map(u => (
              <button key={u.id} className="chat-row w-full flex items-center gap-3 px-3 py-2.5 text-left"
                onClick={() => startChat(u.id)}>
                <Avatar name={u.displayName || u.username} imageUrl={u.avatarUrl}
                  online={u.onlineStatus === 'online'} />
                <div className="min-w-0">
                  <div className="font-semibold truncate">{u.displayName || u.username}</div>
                  <div className="text-sm truncate" style={{ color: 'var(--color-text-muted)' }}>@{u.username}</div>
                </div>
              </button>
            ))}
            <div className="mx-3 my-2 border-t" style={{ borderColor: 'var(--color-border)' }} />
          </>
        )}

        {chats.length === 0 && !q && (
          <div className="flex flex-col items-center gap-3 pt-24 px-8 text-center"
            style={{ color: 'var(--color-text-muted)' }}>
            <Users size={40} strokeWidth={1.5} />
            <p className="text-sm">Чатов пока нет.<br />Найди собеседника через поиск и нажми на него.</p>
          </div>
        )}

        {(Array.isArray(chats) ? chats : []).map(c => {
          const p = peer(c);
          return (
            <button key={c.id}
              className={`chat-row w-full flex items-center gap-3 px-3 py-2.5 text-left ${c.id === activeId ? 'active' : ''}`}
              onClick={() => navigate(`/chat/${c.id}`)}>
              <Avatar name={title(c)} imageUrl={c.avatarUrl || p?.avatarUrl}
                online={p?.onlineStatus === 'online'} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold truncate">{title(c)}</span>
                  <span className="ml-auto text-xs shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                    {fmtListTime(c.lastMessage?.createdAt || c.updatedAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm truncate flex-1" style={{ color: 'var(--color-text-muted)' }}>
                    {c.lastMessage?.text || 'Нет сообщений'}
                  </span>
                  {!!c.unreadCount && <span className="badge-unread">{c.unreadCount}</span>}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* FAB */}
      <button className="btn-accent absolute bottom-24 right-5 !rounded-full w-14 h-14 !p-0"
        onClick={() => { const el = searchRef.current; el?.scrollIntoView({ behavior: 'smooth' }); el?.focus(); el?.classList.add('ring-pulse'); setTimeout(() => el?.classList.remove('ring-pulse'), 900); }} title="Новый чат">
        <Plus size={22} />
      </button>
    </aside>
  );
            }

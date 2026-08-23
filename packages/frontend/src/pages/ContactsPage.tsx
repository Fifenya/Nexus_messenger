import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Search, UserPlus, Users } from 'lucide-react';
import { api } from '../utils/api';
import { useAuthStore } from '../store/auth.store';
import { Avatar } from '../components/ui';
import BottomNav from '../components/BottomNav';

export default function ContactsPage() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const [q, setQ] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [groupMode, setGroupMode] = useState(false);
  const [sel, setSel] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!q.trim()) { setUsers([]); return; }
    const t = setTimeout(() => {
      api.get(`/users/search?q=${q}`)
        .then(r => setUsers((Array.isArray(r.data) ? r.data : []).filter((u: any) => u.id !== user?.id)))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const toggle = (id: string) => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const createGroup = async () => {
    if (!groupName.trim() || sel.length === 0) return;
    try {
      const r = await api.post('/chats', { type: 'GROUP', title: groupName.trim(), memberIds: sel });
      setGroupMode(false); setSel([]); setGroupName('');
      if (r.data?.id) navigate(`/chat/${r.data.id}`);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="h-[100dvh] flex flex-col chat-wallpaper">
      <header className="px-4 pt-4 pb-2 flex items-center gap-3">
        <div className="text-xl font-extrabold flex-1">Контакты</div>
        <button className="btn-accent !rounded-full px-4 !py-2 text-sm"
          onClick={() => { setGroupMode(m => !m); setSel([]); }}>
          <Users size={16} /> {groupMode ? 'Отмена' : 'Группа'}
        </button>
      </header>
      <div className="px-3 pb-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
          <input ref={ref} className="nexus-input pl-10" placeholder="Поиск по имени пользователя"
            value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-40">
        {users.map(u => (
          <button key={u.id} className="chat-row w-full flex items-center gap-3 px-2 py-2.5 rounded-xl text-left"
            onClick={() => groupMode ? toggle(u.id) : navigate(`/user/${u.id}`)}>
            <Avatar name={u.displayName || u.username} imageUrl={u.avatarUrl} online={u.onlineStatus === 'online'} />
            <div className="min-w-0 flex-1">
              <div className="font-semibold truncate">{u.displayName || u.username}</div>
              <div className="text-sm truncate" style={{ color: 'var(--color-text-muted)' }}>@{u.username}</div>
            </div>
            {groupMode && (
              <span className="w-6 h-6 rounded-full border flex items-center justify-center shrink-0"
                style={sel.includes(u.id)
                  ? { background: 'var(--color-accent)', borderColor: 'var(--color-accent)', color: '#fff' }
                  : { borderColor: 'var(--color-border)' }}>
                {sel.includes(u.id) && <Check size={14} />}
              </span>
            )}
          </button>
        ))}

        {!q.trim() && (
          <div className="flex flex-col items-center gap-4 pt-14 text-center px-6">
            <div className="text-6xl">🐈‍</div>
            <div className="text-lg font-bold">Добавить контакты</div>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Кот обошёл все дворы — пока никого нет. Найди друзей по username или собери группу.
            </p>
            <div className="flex gap-2">
              <button className="btn-accent !rounded-full px-5" onClick={() => ref.current?.focus()}>
                <UserPlus size={18} /> Новый контакт
              </button>
              <button className="btn-accent !rounded-full px-5"
                style={{ background: 'var(--color-surface)', boxShadow: 'none', color: 'var(--color-text)' }}
                onClick={() => setGroupMode(true)}>
                <Users size={18} /> Создать группу
              </button>
            </div>
          </div>
        )}

        {q.trim() && users.length === 0 && (
          <div className="flex flex-col items-center gap-3 pt-14 text-center" style={{ color: 'var(--color-text-muted)' }}>
            <div className="text-5xl">🐱</div>
            <div className="text-sm">Кот никого не нашёл по «{q}»</div>
          </div>
        )}
      </div>

      {groupMode && (
        <div className="fixed left-0 right-0 bottom-14 z-40 border-t p-3 flex gap-2"
          style={{ background: 'var(--color-background-secondary)', borderColor: 'var(--color-border)' }}>
          <input className="nexus-input flex-1" placeholder="Название группы"
            value={groupName} onChange={e => setGroupName(e.target.value)} />
          <button className="btn-accent shrink-0" disabled={!groupName.trim() || sel.length === 0} onClick={createGroup}>
            Создать {sel.length > 0 && `(${sel.length})`}
          </button>
        </div>
      )}
      <BottomNav />
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, User as UserIcon, Check, Search } from 'lucide-react';
import { Avatar } from '../components/ui';
import { api } from '../utils/api';
import { useAuthStore } from '../store/auth.store';

export default function CreateChatPage() {
  const navigate = useNavigate();
  const me = useAuthStore(s => s.user);
  const [mode, setMode] = useState<'private' | 'group'>('private');
  const [q, setQ] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any[]>([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/users/search?q=').then(r => setUsers(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      api.get(`/users/search?q=${encodeURIComponent(q)}`).then(r => setUsers(r.data || [])).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const toggle = (u: any) => {
    if (mode === 'private') {
      setSelected([u]);
    } else {
      setSelected(prev => prev.find(x => x.id === u.id) ? prev.filter(x => x.id !== u.id) : [...prev, u]);
    }
  };

  const create = async () => {
    setLoading(true);
    setError('');
    try {
      if (mode === 'private') {
        if (!selected[0]) { setError('Выбери собеседника'); setLoading(false); return; }
        const r = await api.post('/chats', { type: 'PRIVATE', memberIds: [selected[0].id] });
        navigate(`/chat/${r.data.id}`);
      } else {
        if (selected.length < 2) { setError('Выбери минимум 2 участников'); setLoading(false); return; }
        if (!groupName.trim()) { setError('Введи название группы'); setLoading(false); return; }
        const r = await api.post('/chats', { type: 'GROUP', title: groupName.trim(), memberIds: selected.map(u => u.id) });
        navigate(`/chat/${r.data.id}`);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Ошибка создания');
    }
    setLoading(false);
  };

  const filtered = users.filter(u => u.id !== me?.id);

  return (
    <div className="h-[100dvh] flex flex-col">
      <header className="flex items-center gap-3 px-4 py-3 border-b sticky top-0 z-10"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-background)' }}>
        <button className="icon-btn" onClick={() => navigate('/')}><ArrowLeft size={20} /></button>
        <div className="font-semibold flex-1">Новый чат</div>
      </header>

      <div className="p-4 space-y-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => { setMode('private'); setSelected([]); }}
            className={`p-3 rounded-xl flex items-center gap-2 justify-center border-2 transition ${mode === 'private' ? 'border-[var(--color-accent)]' : 'border-transparent'}`}
            style={{ background: 'var(--color-surface)' }}>
            <UserIcon size={18} /> Личный
          </button>
          <button onClick={() => { setMode('group'); setSelected([]); }}
            className={`p-3 rounded-xl flex items-center gap-2 justify-center border-2 transition ${mode === 'group' ? 'border-[var(--color-accent)]' : 'border-transparent'}`}
            style={{ background: 'var(--color-surface)' }}>
            <Users size={18} /> Группа
          </button>
        </div>

        {mode === 'group' && (
          <input type="text" placeholder="Название группы" value={groupName} onChange={e => setGroupName(e.target.value)}
            className="nexus-input w-full" />
        )}

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
          <input type="text" placeholder="Поиск по username..." value={q} onChange={e => setQ(e.target.value)}
            className="nexus-input w-full !pl-9" />
        </div>

        {mode === 'group' && selected.length > 0 && (
          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Выбрано: {selected.length}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
            Никого не нашли
          </div>
        )}
        {filtered.map(u => {
          const isSelected = selected.find(x => x.id === u.id);
          return (
            <button key={u.id} onClick={() => toggle(u)}
              className="w-full flex items-center gap-3 p-4 hover:bg-black/5 transition border-b"
              style={{ borderColor: 'var(--color-border)' }}>
              <Avatar src={u.avatarUrl} name={u.displayName || u.username} size={44} />
              <div className="flex-1 text-left">
                <div className="font-semibold">{u.displayName || u.username}</div>
                <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>@{u.username}</div>
              </div>
              {isSelected && (
                <div className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--color-accent)' }}>
                  <Check size={14} className="text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t" style={{ borderColor: 'var(--color-border)', background: 'var(--color-background)' }}>
        {error && <div className="text-red-500 text-sm mb-2 text-center">{error}</div>}
        <button onClick={create} disabled={loading || selected.length === 0}
          className="btn-accent w-full !py-3">
          {loading ? 'Создаём...' : mode === 'private' ? 'Создать чат' : `Создать группу (${selected.length})`}
        </button>
      </div>
    </div>
  );
}

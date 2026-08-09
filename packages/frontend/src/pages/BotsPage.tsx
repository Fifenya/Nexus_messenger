import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, Copy, Key, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { api } from '../utils/api';
import BottomNav from '../components/BottomNav';

export default function BotsPage() {
  const navigate = useNavigate();
  const [bots, setBots] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', username: '', description: '', webhookUrl: '' });

  useEffect(() => {
    api.get('/bots').then(r => setBots(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const save = async () => {
    try {
      if (editing) {
        await api.put(`/bots/${editing.id}`, form);
      } else {
        await api.post('/bots', form);
      }
      setShowCreate(false);
      setEditing(null);
      setForm({ name: '', username: '', description: '', webhookUrl: '' });
      api.get('/bots').then(r => setBots(Array.isArray(r.data) ? r.data : []));
    } catch (e) { console.error(e); }
  };

  const del = async (id: string) => {
    if (!confirm('Удалить бота?')) return;
    await api.delete(`/bots/${id}`).catch(() => {});
    setBots(s => s.filter(b => b.id !== id));
  };

  const regen = async (id: string) => {
    const r = await api.post(`/bots/${id}/regenerate-token`).catch(() => null);
    if (r) {
      const updated = await api.get('/bots');
      setBots(Array.isArray(updated.data) ? updated.data : []);
      alert('Новый токен скопирован: ' + r.data.token);
    }
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    alert('Токен скопирован: ' + token);
  };

  const card: React.CSSProperties = { background: 'var(--color-surface)', borderColor: 'var(--color-border)' };
  const muted: React.CSSProperties = { color: 'var(--color-text-muted)' };

  return (
    <div className="h-[100dvh] overflow-y-auto chat-wallpaper pb-24">
      <header className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button className="icon-btn" onClick={() => navigate('/settings')}><ArrowLeft size={20} /></button>
        <div className="text-xl font-extrabold flex-1">Боты</div>
        <button className="btn-accent !rounded-full !px-4" onClick={() => { setShowCreate(true); setEditing(null); setForm({ name: '', username: '', description: '', webhookUrl: '' }); }}>
          <Plus size={16} /> Создать
        </button>
      </header>

      <div className="max-w-2xl mx-auto p-3 space-y-3">
        {bots.map(b => (
          <div key={b.id} className="rounded-2xl border p-4 space-y-3" style={card}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-accent)' }}>
                <Bot size={24} style={{ color: '#fff' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold">{b.name}</div>
                <div className="text-sm" style={muted}>@{b.username}</div>
              </div>
              <button className="icon-btn" onClick={() => { setEditing(b); setForm({ name: b.name, username: b.username, description: b.description || '', webhookUrl: b.webhookUrl || '' }); setShowCreate(true); }}>
                <Pencil size={18} />
              </button>
              <button className="icon-btn" onClick={() => del(b.id)}><Trash2 size={18} /></button>
            </div>
            {b.description && <div className="text-sm" style={muted}>{b.description}</div>}
            <div className="flex items-center gap-2 text-xs">
              <Key size={14} />
              <code className="flex-1 truncate" style={{ color: 'var(--color-text-muted)' }}>{b.token}</code>
              <button className="icon-btn !p-1" onClick={() => copyToken(b.token)}><Copy size={14} /></button>
              <button className="icon-btn !p-1" onClick={() => regen(b.id)}><RefreshCw size={14} /></button>
            </div>
          </div>
        ))}
        {bots.length === 0 && !showCreate && (
          <div className="text-center py-16" style={muted}>
            <Bot size={48} className="mx-auto mb-4 opacity-30" />
            <div>Ботов пока нет. Создай первого!</div>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-2xl p-5 space-y-3" style={{ background: 'var(--color-surface)' }} onClick={e => e.stopPropagation()}>
            <div className="text-lg font-bold">{editing ? 'Редактировать бота' : 'Создать бота'}</div>
            <input className="nexus-input" placeholder="Имя бота" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <input className="nexus-input" placeholder="Username (латиница)" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
            <textarea className="nexus-input resize-none" rows={2} placeholder="Описание (опционально)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <input className="nexus-input" placeholder="Webhook URL (опционально)" value={form.webhookUrl} onChange={e => setForm(f => ({ ...f, webhookUrl: e.target.value }))} />
            <div className="flex gap-2">
              <button className="btn-accent flex-1" onClick={save}>{editing ? 'Сохранить' : 'Создать'}</button>
              <button className="btn-accent flex-1" style={{ background: 'var(--color-text-muted)', boxShadow: 'none' }} onClick={() => setShowCreate(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}

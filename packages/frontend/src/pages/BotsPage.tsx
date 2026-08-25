import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, Copy, Key, Pencil, RefreshCw, Send, Trash2 } from 'lucide-react';
import { api } from '../utils/api';
import BottomNav from '../components/BottomNav';

export default function BotsPage() {
  const navigate = useNavigate();
  const [bots, setBots] = useState<any[]>([]);
  const [wizard, setWizard] = useState<null | { step: 'name' | 'username'; name?: string; log: { who: 'bf' | 'me'; text: string }[] }>(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const refresh = () => api.get('/bots').then(r => setBots(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  useEffect(() => { refresh(); }, []);

  const startWizard = () => {
    setCreated(null);
    setWizard({ step: 'name', log: [{ who: 'bf', text: 'Привет! Я BotFather 🤖 Сделаем бота. Как он будет называться? Это имя увидят собеседники.' }] });
    setInput('');
  };

  const submitWizard = async () => {
    if (!wizard || busy) return;
    const v = input.trim();
    if (!v) return;
    if (wizard.step === 'name') {
      setWizard({ ...wizard, step: 'username', name: v, log: [...wizard.log, { who: 'me', text: v }, { who: 'bf', text: 'Отлично! Теперь username: латиница, цифры, «_», и обязательно заканчивается на «bot». Например: my_cool_bot' }] });
      setInput('');
      return;
    }
    setBusy(true);
    try {
      const r = await api.post('/bots', { name: wizard.name, username: v.toLowerCase() });
      setCreated(r.data);
      setWizard(null);
      refresh();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Не получилось, попробуй другой username';
      setWizard({ ...wizard, log: [...wizard.log, { who: 'me', text: v }, { who: 'bf', text: '⚠️ ' + msg }] });
      setInput('');
    } finally { setBusy(false); }
  };

  const copy = (t: string) => navigator.clipboard?.writeText(t);

  const del = async (id: string) => {
    if (!confirm('Удалить бота? Его сообщения тоже удалятся.')) return;
    await api.delete(`/bots/${id}`).catch(() => {});
    refresh();
  };

  const regen = async (id: string) => {
    await api.post(`/bots/${id}/regenerate-token`).catch(() => {});
    refresh();
  };

  const saveEdit = async () => {
    await api.put(`/bots/${editing.id}`, form).catch(() => {});
    setEditing(null);
    refresh();
  };

  const card: React.CSSProperties = { background: 'var(--color-surface)', borderColor: 'var(--color-border)' };
  const muted: React.CSSProperties = { color: 'var(--color-text-muted)' };

  return (
    <div className="h-[100dvh] flex flex-col">
      <header className="flex items-center gap-3 px-3 py-2.5 border-b"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-background-secondary)' }}>
        <button className="icon-btn" onClick={() => navigate('/settings')}><ArrowLeft size={20} /></button>
        <div className="font-bold flex-1">Боты</div>
        <button className="btn-accent !rounded-full px-4 py-2" onClick={startWizard}>Создать</button>
      </header>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 max-w-2xl w-full mx-auto">
        {bots.map(b => (
          <div key={b.id} className="rounded-2xl border p-4 space-y-3" style={card}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-accent)' }}>
                <Bot size={24} style={{ color: '#fff' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold">{b.name} <span className="text-xs font-normal" style={muted}>🤖</span></div>
                <div className="text-sm" style={muted}>@{b.username}</div>
              </div>
              <button className="icon-btn" onClick={() => { setEditing(b); setForm({ name: b.name, description: b.description || '' }); }}><Pencil size={18} /></button>
              <button className="icon-btn" onClick={() => del(b.id)}><Trash2 size={18} /></button>
            </div>
            {b.description && <div className="text-sm" style={muted}>{b.description}</div>}
            <div className="flex items-center gap-2 text-xs">
              <Key size={14} />
              <code className="flex-1 truncate" style={muted}>{b.apiId}</code>
              <button className="icon-btn !p-1" onClick={() => copy(b.apiId)}><Copy size={14} /></button>
              <button className="icon-btn !p-1" onClick={() => regen(b.id)}><RefreshCw size={14} /></button>
            </div>
            <div className="text-xs" style={muted}>Добавь бота в чат через поиск «@{b.username}», чтобы он получал сообщения.</div>
          </div>
        ))}
        {bots.length === 0 && !wizard && !created && (
          <div className="text-center py-16" style={muted}>
            <Bot size={48} className="mx-auto mb-4 opacity-30" />
            <div>Ботов пока нет. Создай первого!</div>
          </div>
        )}
      </div>
      <BottomNav />

      {wizard && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/70">
          <div className="flex items-center gap-3 px-3 py-2.5" style={{ background: 'var(--color-background-secondary)' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--color-accent)' }}>
              <Bot size={18} style={{ color: '#fff' }} />
            </div>
            <div>
              <div className="font-bold">BotFather</div>
              <div className="text-xs" style={muted}>создание бота</div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 chat-wallpaper">
            {wizard.log.map((m, i) => (
              <div key={i} className={`flex ${m.who === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`bubble ${m.who === 'me' ? 'bubble-out' : 'bubble-in'}`} style={{ maxWidth: '85%' }}>{m.text}</div>
              </div>
            ))}
          </div>
          <div className="flex items-end gap-2 p-3 border-t" style={{ borderColor: 'var(--color-border)', background: 'var(--color-background-secondary)' }}>
            <input className="nexus-input flex-1" autoFocus
              placeholder={wizard.step === 'name' ? 'Имя бота…' : 'username_bot…'}
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitWizard(); }} />
            <button className="btn-accent !rounded-full w-12 h-12 !p-0" disabled={busy} onClick={submitWizard}><Send size={18} /></button>
          </div>
        </div>
      )}

      {created && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setCreated(null)}>
          <div className="w-full max-w-md rounded-2xl p-5 space-y-3" style={card} onClick={e => e.stopPropagation()}>
            <div className="text-lg font-bold">✅ Бот создан!</div>
            <p className="text-sm" style={muted}>@{created.username} готов к работе. Его API ID:</p>
            <div className="flex items-center gap-2 rounded-xl border p-3" style={{ borderColor: 'var(--color-border)' }}>
              <code className="flex-1 text-sm font-bold" style={{ color: 'var(--color-accent)' }}>{created.apiId}</code>
              <button className="icon-btn !p-1" onClick={() => copy(created.apiId)}><Copy size={16} /></button>
            </div>
            <pre className="text-[10px] overflow-auto rounded-xl p-3" style={{ background: 'var(--color-background-secondary)', color: 'var(--color-text-muted)' }}>
{`GET  /botapi/${created.apiId}/updates
POST /botapi/${created.apiId}/send
{"chatId":"…","text":"привет"}`}
            </pre>
            <button className="btn-accent w-full" onClick={() => setCreated(null)}>Готово</button>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-md rounded-2xl p-5 space-y-3" style={card} onClick={e => e.stopPropagation()}>
            <div className="text-lg font-bold">Редактировать</div>
            <input className="nexus-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Имя" />
            <textarea className="nexus-input resize-none" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Описание" />
            <button className="btn-accent w-full" onClick={saveEdit}>Сохранить</button>
          </div>
        </div>
      )}
    </div>
  );
}

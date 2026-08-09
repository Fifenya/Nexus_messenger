import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { api } from '../utils/api';
import BottomNav from '../components/BottomNav';

export default function PrivacyPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<any>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/privacy').then(r => {
      const map: any = {};
      (Array.isArray(r.data) ? r.data : []).forEach((s: any) => { map[s.field] = s.value; });
      setSettings(map);
    }).catch(() => {});
  }, []);

  const update = (field: string, value: string) => setSettings((s: any) => ({ ...s, [field]: value }));

  const save = async () => {
    try {
      await api.put('/privacy', settings);
      setSaved(true); setTimeout(() => setSaved(false), 1500);
    } catch (e) { console.error(e); }
  };

  const card: React.CSSProperties = { background: 'var(--color-surface)', borderColor: 'var(--color-border)' };
  const muted: React.CSSProperties = { color: 'var(--color-text-muted)' };

  return (
    <div className="h-[100dvh] overflow-y-auto chat-wallpaper pb-24">
      <header className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button className="icon-btn" onClick={() => navigate('/settings')}><ArrowLeft size={20} /></button>
        <div className="text-xl font-extrabold">Приватность</div>
      </header>

      <div className="max-w-2xl mx-auto p-3 space-y-3">
        <section className="rounded-2xl border p-4 space-y-3" style={card}>
          <div className="text-xs font-semibold uppercase tracking-wide" style={muted}>Кто видит</div>
          <div className="flex items-center justify-between">
            <span>Телефон</span>
            <select className="nexus-input !w-auto" value={settings.phoneVisibility || 'EVERYONE'} onChange={e => update('phoneVisibility', e.target.value)}>
              <option value="EVERYONE">Все</option>
              <option value="CONTACTS">Контакты</option>
              <option value="NOBODY">Никто</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span>Статус «в сети»</span>
            <select className="nexus-input !w-auto" value={settings.onlineStatus || 'EVERYONE'} onChange={e => update('onlineStatus', e.target.value)}>
              <option value="EVERYONE">Все</option>
              <option value="CONTACTS">Контакты</option>
              <option value="NOBODY">Никто</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span>Последний визит</span>
            <select className="nexus-input !w-auto" value={settings.lastSeen || 'EVERYONE'} onChange={e => update('lastSeen', e.target.value)}>
              <option value="EVERYONE">Все</option>
              <option value="CONTACTS">Контакты</option>
              <option value="NOBODY">Никто</option>
            </select>
          </div>
        </section>

        <section className="rounded-2xl border p-4 space-y-3" style={card}>
          <div className="text-xs font-semibold uppercase tracking-wide" style={muted}>Безопасность</div>
          <div className="flex items-center justify-between">
            <span>Запрет пересылки сообщений</span>
            <button className="btn-accent !rounded-full !px-4" onClick={() => update('forwardRestriction', settings.forwardRestriction === 'true' ? 'false' : 'true')}>
              {settings.forwardRestriction === 'true' ? 'Вкл' : 'Выкл'}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span>Автоудаление (часов)</span>
            <input type="number" className="nexus-input !w-20" value={settings.autoDeleteTimer || '0'} onChange={e => update('autoDeleteTimer', e.target.value)} />
          </div>
        </section>

        <button className="btn-accent w-full" onClick={save}>{saved ? <Check size={18} /> : 'Сохранить'}</button>
      </div>
      <BottomNav />
    </div>
  );
}

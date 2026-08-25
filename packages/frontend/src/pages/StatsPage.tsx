import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Heart, MessageCircle, MessagesSquare, Paperclip, Send, Trophy, Users } from 'lucide-react';
import { api } from '../utils/api';
import BottomNav from '../components/BottomNav';

export default function StatsPage() {
  const navigate = useNavigate();
  const [st, setSt] = useState<any>(null);

  useEffect(() => {
    api.get('/users/me/stats').then(r => setSt(r.data)).catch(() => setSt({}));
  }, []);

  const card: React.CSSProperties = { background: 'var(--color-surface)', borderColor: 'var(--color-border)' };
  const muted: React.CSSProperties = { color: 'var(--color-text-muted)' };

  const tiles = st ? [
    { icon: Send, color: '#e05050', label: 'Отправлено', value: st.sent },
    { icon: MessagesSquare, color: '#2196f3', label: 'Получено', value: st.received },
    { icon: Heart, color: '#e91e63', label: 'Реакций поставлено', value: st.reactionsGiven },
    { icon: Trophy, color: '#ff9800', label: 'Реакций получено', value: st.reactionsReceived },
    { icon: Paperclip, color: '#4caf50', label: 'Вложений', value: st.attachments },
    { icon: Users, color: '#9c27b0', label: 'Чатов', value: st.chatsCount },
  ] : [];

  const maxTop = st?.topChats?.length ? Math.max(...st.topChats.map((t: any) => t.count)) : 1;

  return (
    <div className="h-[100dvh] overflow-y-auto chat-wallpaper pb-24">
      <header className="px-4 pt-4 pb-2 flex items-center gap-3 sticky top-0 z-10" style={{ background: 'var(--color-background)' }}>
        <button className="icon-btn" onClick={() => navigate('/settings')}><ArrowLeft size={20} /></button>
        <div className="text-xl font-extrabold">Статистика</div>
      </header>

      <div className="max-w-2xl mx-auto p-3 space-y-3">
        {!st && <div className="text-sm text-center py-10" style={muted}>Загрузка…</div>}

        {st && (
          <>
            <section className="rounded-2xl border p-4" style={card}>
              <div className="flex items-center gap-2 text-sm" style={muted}>
                <CalendarDays size={16} style={{ color: 'var(--color-accent)' }} />
                В Nexus с {new Date(st.since).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3">
              {tiles.map((t: any, i: number) => {
                const Icon = t.icon;
                return (
                  <div key={i} className="rounded-2xl border p-4 flex items-center gap-3" style={card}>
                    <span className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: t.color }}>
                      <Icon size={20} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xl font-extrabold leading-tight">{t.value}</span>
                      <span className="block text-xs truncate" style={muted}>{t.label}</span>
                    </span>
                  </div>
                );
              })}
            </section>

            {st.topChats?.length > 0 && (
              <section className="rounded-2xl border p-4 space-y-3" style={card}>
                <div className="text-xs font-semibold uppercase tracking-wide" style={muted}>Топ чатов по активности</div>
                {st.topChats.map((t: any, i: number) => (
                  <div key={t.id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-semibold truncate">{i + 1}. {t.title}</span>
                      <span style={muted}>{t.count}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'color-mix(in srgb, var(--color-text) 12%, transparent)' }}>
                      <div className="h-full rounded-full" style={{ width: `${(t.count / maxTop) * 100}%`, background: 'var(--color-accent)' }} />
                    </div>
                  </div>
                ))}
              </section>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

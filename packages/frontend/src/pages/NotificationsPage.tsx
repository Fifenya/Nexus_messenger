import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BellRing } from 'lucide-react';
import { useNotifySettings } from '../store/notify.store';
import { playBeep, notifyMessage } from '../lib/notify';

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button className="w-12 h-7 rounded-full p-1 shrink-0 transition-colors"
      style={{ background: on ? 'var(--color-accent)' : 'var(--color-border)' }}
      onClick={() => onChange(!on)}>
      <div className="w-5 h-5 rounded-full bg-white transition-transform"
        style={{ transform: on ? 'translateX(20px)' : 'translateX(0)' }} />
    </button>
  );
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const s = useNotifySettings();
  const [perm, setPerm] = useState<string>('Notification' in window ? Notification.permission : 'unsupported');

  const toggleBrowser = async (v: boolean) => {
    if (v && 'Notification' in window && Notification.permission === 'default') {
      const p = await Notification.requestPermission();
      setPerm(p);
      if (p !== 'granted') { s.set({ browser: false }); return; }
    }
    if (v && perm === 'denied') return;
    s.set({ browser: v });
  };

  const row = 'rounded-2xl border p-4 flex items-center gap-3';
  const st = { borderColor: 'var(--color-border)', background: 'var(--color-surface)' };

  return (
    <div className="h-[100dvh] flex flex-col">
      <header className="flex items-center gap-3 px-3 py-2.5 border-b"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-background-secondary)' }}>
        <button className="icon-btn" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <div className="font-bold">Уведомления</div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 w-full max-w-2xl mx-auto">
        <div className={row} style={st}>
          <div className="flex-1">
            <div className="font-semibold">Браузерные уведомления</div>
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {perm === 'granted' ? 'Разрешение выдано' : perm === 'denied' ? 'Запрещено браузером' : 'Сообщения, когда вкладка свёрнута'}
            </div>
          </div>
          <Toggle on={s.browser} onChange={toggleBrowser} />
        </div>

        <div className={row} style={st}>
          <div className="flex-1">
            <div className="font-semibold">Звук</div>
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Короткий сигнал при новом сообщении</div>
          </div>
          <Toggle on={s.sound} onChange={v => { s.set({ sound: v }); if (v) playBeep(); }} />
        </div>

        <div className={row} style={st}>
          <div className="flex-1">
            <div className="font-semibold">Текст сообщения</div>
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Показывать содержание в уведомлении</div>
          </div>
          <Toggle on={s.preview} onChange={v => s.set({ preview: v })} />
        </div>

        <button className="btn-accent w-full flex items-center justify-center gap-2"
          onClick={() => notifyMessage('Nexus', 'Уведомления работают!', true)}>
          <BellRing size={18} /> Проверить
        </button>
      </div>
    </div>
  );
}

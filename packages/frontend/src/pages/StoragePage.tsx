import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HardDrive, Trash2, ShieldCheck } from 'lucide-react';
import { useNotifySettings } from '../store/notify.store';

function fmtBytes(n?: number) {
  if (!n) return '0 МБ';
  const mb = n / 1024 / 1024;
  if (mb >= 1024) return (mb / 1024).toFixed(2) + ' ГБ';
  return mb.toFixed(1) + ' МБ';
}

export default function StoragePage() {
  const navigate = useNavigate();
  const s = useNotifySettings();
  const [est, setEst] = useState<{ usage?: number; quota?: number }>({});
  const [persisted, setPersisted] = useState(false);
  const [cleared, setCleared] = useState(false);

  const refresh = () => {
    try {
      navigator.storage?.estimate?.().then(e => setEst(e));
      navigator.storage?.persisted?.().then(setPersisted);
    } catch {}
  };
  useEffect(refresh, []);

  const clearCache = async () => {
    try {
      if ('caches' in window) (await caches.keys()).forEach(k => caches.delete(k));
    } catch {}
    setCleared(true);
    setTimeout(() => setCleared(false), 1500);
    refresh();
  };

  const row = 'rounded-2xl border p-4 flex items-center gap-3';
  const st = { borderColor: 'var(--color-border)', background: 'var(--color-surface)' };
  const pct = est.quota ? Math.min(100, ((est.usage || 0) / est.quota) * 100) : 0;

  return (
    <div className="h-[100dvh] flex flex-col">
      <header className="flex items-center gap-3 px-3 py-2.5 border-b"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-background-secondary)' }}>
        <button className="icon-btn" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <div className="font-bold">Данные и память</div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 w-full max-w-2xl mx-auto">
        <div className={row} style={st}>
          <HardDrive size={20} style={{ color: 'var(--color-accent)' }} />
          <div className="flex-1">
            <div className="font-semibold">Занято в браузере</div>
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {fmtBytes(est.usage)} из {fmtBytes(est.quota)}
            </div>
            <div className="h-1.5 rounded-full mt-2" style={{ background: 'var(--color-border)' }}>
              <div className="h-full rounded-full" style={{ width: `${Math.max(2, pct)}%`, background: 'var(--color-accent)' }} />
            </div>
          </div>
        </div>

        <div className={row} style={st}>
          <div className="flex-1">
            <div className="font-semibold">Автозагрузка медиа</div>
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Картинки в чатах грузятся сами</div>
          </div>
          <button className="w-12 h-7 rounded-full p-1 shrink-0 transition-colors"
            style={{ background: s.autodownload ? 'var(--color-accent)' : 'var(--color-border)' }}
            onClick={() => s.set({ autodownload: !s.autodownload })}>
            <div className="w-5 h-5 rounded-full bg-white transition-transform"
              style={{ transform: s.autodownload ? 'translateX(20px)' : 'translateX(0)' }} />
          </button>
        </div>

        {!persisted && (
          <button className="btn-accent w-full flex items-center justify-center gap-2"
            onClick={() => navigator.storage?.persist?.().then(() => refresh())}>
            <ShieldCheck size={18} /> Запросить постоянное хранилище
          </button>
        )}

        <button className="btn-accent w-full flex items-center justify-center gap-2"
          style={{ background: 'var(--color-error)', boxShadow: 'none' }}
          onClick={clearCache}>
          <Trash2 size={18} /> {cleared ? 'Готово ✓' : 'Очистить кэш'}
        </button>
      </div>
    </div>
  );
}

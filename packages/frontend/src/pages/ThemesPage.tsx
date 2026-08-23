import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Palette } from 'lucide-react';
import { api } from '../utils/api';
import { useThemeStore } from '../store/themeStore';
import BottomNav from '../components/BottomNav';

export default function ThemesPage() {
  const navigate = useNavigate();
  const { setTheme } = useThemeStore();
  const [themes, setThemes] = useState<any[]>([]);

  useEffect(() => {
    api.get('/themes').then(r => setThemes(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const apply = (t: any) => {
    setTheme({ name: t.name, colors: t.colors });
  };

  return (
    <div className="h-[100dvh] overflow-y-auto chat-wallpaper pb-24">
      <header className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button className="icon-btn" onClick={() => navigate('/settings')}><ArrowLeft size={20} /></button>
        <div className="text-xl font-extrabold">Темы</div>
      </header>

      <div className="max-w-2xl mx-auto p-3 space-y-3">
        {themes.map(t => (
          <div key={t.id} className="rounded-2xl border p-4 flex items-center gap-3"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: t.colors?.accent || 'var(--color-accent)' }}>
              <Palette size={20} style={{ color: '#fff' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold">{t.name}</div>
              <div className="text-sm truncate" style={{ color: 'var(--color-text-muted)' }}>
                {t.description || (t.isDefault ? 'Системная тема' : `от ${t.author?.username || 'неизвестно'}`)}
              </div>
            </div>
            <button className="btn-accent !rounded-full px-4" onClick={() => apply(t)}>
              <Check size={16} /> Применить
            </button>
          </div>
        ))}
        {themes.length === 0 && (
          <div className="text-center py-16" style={{ color: 'var(--color-text-muted)' }}>
            Тем пока нет. Скоро появятся!
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

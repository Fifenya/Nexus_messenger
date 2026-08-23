import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image, Palette, Type, MessageSquare, Sun } from 'lucide-react';
import { useChatSettings } from '../store/chatSettings.store';
import { useThemeStore } from '../store/themeStore';

const NAME_COLORS = ['#2196f3', '#e91e63', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4'];

const Toggle = ({ on, onChange }: any) => (
  <button onClick={() => onChange(!on)} className="w-12 h-7 rounded-full relative shrink-0 transition"
    style={{ background: on ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
    <span className="absolute top-1 w-5 h-5 rounded-full bg-white transition-all" style={{ left: on ? 26 : 4 }} />
  </button>
);

export default function ChatSettingsPage() {
  const navigate = useNavigate();
  const s = useChatSettings();
  const { theme, setTheme, wallpaperUrl } = useThemeStore();
  const [pickName, setPickName] = useState(false);
  useEffect(() => { s.apply(); }, []);

  return (
    <div className="h-[100dvh] flex flex-col" style={{ background: 'var(--color-background)' }}>
      <header className="flex items-center gap-3 px-4 py-3 border-b sticky top-0 z-10"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-background)' }}>
        <button className="icon-btn" onClick={() => navigate('/settings')}><ArrowLeft size={22} /></button>
        <div className="font-semibold text-lg flex-1">Настройки чатов</div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl mx-auto w-full pb-24">
        <section className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--color-surface)' }}>
          <div className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>Размер текста сообщений</div>
          <div className="flex items-center gap-3">
            <input type="range" min={10} max={20} value={s.fontSize}
              onChange={e => s.set({ fontSize: +e.target.value })}
              className="w-full" style={{ accentColor: 'var(--color-accent)' }} />
            <span className="text-lg w-8 text-right" style={{ color: 'var(--color-accent)' }}>{s.fontSize}</span>
          </div>
          <div className="rounded-xl overflow-hidden p-3 space-y-2"
            style={{ background: wallpaperUrl || 'var(--color-background-secondary)' }}>
            <div className="bubble bubble-in max-w-[80%] p-2">
              <div className="sender-name font-medium text-sm">Fifenya</div>
              Доброе утро! 👋
            </div>
            <div className="bubble bubble-out max-w-[80%] ml-auto p-2">В Токио утро 😎</div>
          </div>
          <button className="flex items-center gap-3 w-full text-left pt-2" onClick={() => navigate('/style')}>
            <Image size={20} style={{ color: 'var(--color-accent)' }} />
            <span className="font-medium" style={{ color: 'var(--color-accent)' }}>Изменить обои</span>
          </button>
          <div className="border-t" style={{ borderColor: 'var(--color-border)' }} />
          <button className="flex items-center gap-3 w-full text-left" onClick={() => setPickName(p => !p)}>
            <Palette size={20} style={{ color: 'var(--color-accent)' }} />
            <span className="font-medium flex-1" style={{ color: 'var(--color-accent)' }}>Изменить цвет имени</span>
            <span className="text-xs px-2 py-1 rounded-lg" style={{ background: s.nameColor, color: '#fff' }}>Fifenya</span>
          </button>
          {pickName && (
            <div className="flex gap-2 flex-wrap">
              {NAME_COLORS.map(c => (
                <button key={c} onClick={() => s.set({ nameColor: c })}
                  className="w-8 h-8 rounded-full border-2"
                  style={{ background: c, borderColor: s.nameColor === c ? '#fff' : 'transparent' }} />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--color-surface)' }}>
          <div className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>Углы блоков с сообщениями</div>
          <div className="flex items-center gap-3">
            <input type="range" min={0} max={24} value={s.bubbleRadius}
              onChange={e => s.set({ bubbleRadius: +e.target.value })}
              className="w-full" style={{ accentColor: 'var(--color-accent)' }} />
            <span className="text-lg w-8 text-right" style={{ color: 'var(--color-accent)' }}>{s.bubbleRadius}</span>
          </div>
        </section>

        <section className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--color-surface)' }}>
          <div className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>Цветовая тема</div>
          <div className="grid grid-cols-3 gap-2">
            {(['light', 'dark', 'amoled'] as const).map(t => (
              <button key={t} onClick={() => setTheme(t)}
                className={`p-3 rounded-xl border-2 text-center ${theme === t ? 'border-[var(--color-accent)]' : 'border-transparent'}`}
                style={{ background: 'var(--color-background)' }}>
                <span className="text-xl">{t === 'light' ? '☀️' : t === 'dark' ? '🌙' : '⚫'}</span>
                <div className="text-xs mt-1">{t === 'light' ? 'День' : t === 'dark' ? 'Ночь' : 'AMOLED'}</div>
              </button>
            ))}
          </div>
          <button className="flex items-center gap-3 w-full text-left"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            <Sun size={20} style={{ color: 'var(--color-accent)' }} />
            <span style={{ color: 'var(--color-accent)' }}>Переключить на {theme === 'light' ? 'ночную' : 'дневную'} тему</span>
          </button>
        </section>

        <section className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--color-surface)' }}>
          <div className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>Список чатов</div>
          <div className="grid grid-cols-2 gap-3">
            {([2, 3] as const).map(n => (
              <button key={n} onClick={() => s.set({ listLines: n })}
                className={`p-3 rounded-xl border-2 ${s.listLines === n ? 'border-[var(--color-accent)]' : 'border-transparent'}`}
                style={{ background: 'var(--color-background)' }}>
                <div className="space-y-2">
                  {[0, 1].map(i => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full" style={{ background: 'var(--color-text-muted)', opacity: .4 }} />
                      <div className="flex-1 space-y-1">
                        <div className="h-1.5 rounded" style={{ background: 'var(--color-text-muted)', opacity: .4 }} />
                        {n === 3 && <div className="h-1.5 rounded" style={{ background: 'var(--color-text-muted)', opacity: .3 }} />}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-sm mt-2">{n === 2 ? 'Двухстрочный' : 'Трёхстрочный'}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl p-2" style={{ background: 'var(--color-surface)' }}>
          <div className="flex items-center gap-3 p-3">
            <Type size={20} style={{ color: 'var(--color-text-muted)' }} />
            <div className="flex-1">
              <div className="font-medium">Отправка по Enter</div>
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Иначе Enter — новая строка</div>
            </div>
            <Toggle on={s.enterToSend} onChange={v => s.set({ enterToSend: v })} />
          </div>
          <div className="border-t mx-3" style={{ borderColor: 'var(--color-border)' }} />
          <div className="flex items-center gap-3 p-3">
            <MessageSquare size={20} style={{ color: 'var(--color-text-muted)' }} />
            <div className="flex-1">
              <div className="font-medium">Анимации</div>
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Отключи для экономии заряда</div>
            </div>
            <Toggle on={s.animations} onChange={v => s.set({ animations: v })} />
          </div>
        </section>
      </div>
    </div>
  );
}

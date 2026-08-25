import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, Palette, RotateCcw } from 'lucide-react';
import { useChatSettings } from '../store/chatSettings.store';
import { useNotifySettings } from '../store/notify.store';
import { playBeep } from '../lib/notify';
import { api } from '../utils/api';

const NAME_COLORS = ['#2196f3', '#e91e63', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4'];
const APP_ICONS = [
  { src: '/bubble.png', label: 'Пузырь' },
  { src: '/classic.png', label: 'Классика' },
  { src: '/crimson.png', label: 'Кримсон' },
  { src: '/emboss.png', label: 'Рельеф' },
  { src: '/light.png', label: 'Свет' },
  { src: '/line.png', label: 'Линия' },
  { src: '/neon.png', label: 'Неон' },
];

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

function Section({ title, children }: any) {
  return (
    <section className="rounded-2xl border p-4 space-y-4"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
      <div className="font-semibold" style={{ color: 'var(--color-accent)' }}>{title}</div>
      {children}
    </section>
  );
}

export default function ChatSettingsPage() {
  const navigate = useNavigate();
  const s = useChatSettings();
  const n = useNotifySettings();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const pickWallpaper = async (f: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', f);
      const r = await api.post('/uploads', form);
      s.set({ wallpaper: r.data?.url || r.data });
    } catch (e) { console.error(e); }
    finally { setUploading(false); }
  };

  return (
    <div className="h-[100dvh] flex flex-col">
      <header className="flex items-center gap-3 px-3 py-2.5 border-b"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-background-secondary)' }}>
        <button className="icon-btn" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <div className="font-bold">Настройки чатов</div>
      </header>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 w-full max-w-2xl mx-auto">
        <Section title="Размер текста сообщений">
          <div className="flex items-center gap-3">
            <input type="range" min={12} max={22} className="flex-1" value={s.fontSize}
              onChange={e => s.set({ fontSize: Number(e.target.value) })} />
            <span className="w-8 text-right font-semibold">{s.fontSize}</span>
          </div>
          <div className="rounded-xl chat-wallpaper wp-custom p-3 space-y-2 overflow-hidden">
            <div className="flex justify-start">
              <div className="bubble bubble-in" style={{ fontSize: 'var(--chat-font-size)', width: 'fit-content', maxWidth: '85%' }}>
                <span contentEditable suppressContentEditableWarning className="outline-none block">Доброе утро! 👋</span>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="bubble bubble-out" style={{ fontSize: 'var(--chat-font-size)', width: 'fit-content', maxWidth: '85%' }}>
                <span contentEditable suppressContentEditableWarning className="outline-none block">В Токио утро 😎</span>
              </div>
            </div>
            <div className="text-[11px] text-center" style={{ color: 'var(--color-text-muted)' }}>
              Нажми на пузырь и напиши своё — размер подстроится под текст
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden
            onChange={e => { const f = e.target.files?.[0]; if (f) pickWallpaper(f); e.target.value = ''; }} />
          <div className="flex gap-2">
            <button className="btn-accent flex-1 flex items-center justify-center gap-2" disabled={uploading}
              onClick={() => fileRef.current?.click()}>
              <ImageIcon size={18} /> {uploading ? 'Загрузка…' : 'Изменить обои'}
            </button>
            {s.wallpaper && (
              <button className="btn-accent" style={{ background: 'var(--color-surface)', boxShadow: 'none' }}
                onClick={() => s.set({ wallpaper: null })}>
                <RotateCcw size={18} />
              </button>
            )}
          </div>
          {s.wallpaper && (
            <div className="space-y-3">
              <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
                <div className="px-3 py-2 flex items-center gap-2" style={{ background: 'var(--color-background-secondary)' }}>
                  <div className="w-6 h-6 rounded-full shrink-0" style={{ background: 'var(--color-border)' }} />
                  <span className="text-sm font-semibold truncate">Собеседник</span>
                </div>
                <div className="chat-wallpaper wp-custom p-3 space-y-2">
                  <div className="bubble bubble-in" style={{ width: 'fit-content', fontSize: 'var(--chat-font-size)' }}>Обои не трогают шапку 👆</div>
                  <div className="flex justify-end">
                    <div className="bubble bubble-out" style={{ width: 'fit-content', fontSize: 'var(--chat-font-size)' }}>Только область сообщений</div>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>Высота: {s.wallpaperZoom}% от высоты экрана</div>
                <input type="range" min={50} max={300} className="w-full" value={s.wallpaperZoom}
                  onChange={e => s.set({ wallpaperZoom: Number(e.target.value) })} />
              </div>
              <div>
                <div className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>Сдвиг по горизонтали: {s.wallpaperX}%</div>
                <input type="range" min={0} max={100} className="w-full" value={s.wallpaperX}
                  onChange={e => s.set({ wallpaperX: Number(e.target.value) })} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Замостить плиткой</span>
                <Toggle on={s.wallpaperTile} onChange={v => s.set({ wallpaperTile: v })} />
              </div>
            </div>
          )}
          <div>
            <div className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>Цвет имени собеседника</div>
            <div className="flex gap-2 flex-wrap">
              {NAME_COLORS.map(c => (
                <button key={c} className="w-8 h-8 rounded-full transition-transform active:scale-90"
                  style={{ background: c, boxShadow: s.nameColor === c ? '0 0 0 3px var(--color-surface), 0 0 0 5px ' + c : 'none' }}
                  onClick={() => s.set({ nameColor: c })} />
              ))}
            </div>
          </div>
        </Section>

        <Section title="Углы блоков с сообщениями">
          <div className="flex items-center gap-3">
            <input type="range" min={0} max={28} className="flex-1" value={s.bubbleRadius}
              onChange={e => s.set({ bubbleRadius: Number(e.target.value) })} />
            <span className="w-8 text-right font-semibold">{s.bubbleRadius}</span>
          </div>
        </Section>

        <Section title="Список чатов">
          <div className="grid grid-cols-2 gap-3">
            {([2, 3] as const).map(count => (
              <button key={count} className="rounded-xl border p-3"
                style={{
                  borderColor: s.listLines === count ? 'var(--color-accent)' : 'var(--color-border)',
                  background: 'var(--color-background-secondary)',
                }}
                onClick={() => s.set({ listLines: count })}>
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full shrink-0" style={{ background: 'var(--color-border)' }} />
                      <div className="flex-1 space-y-1">
                        <div className="h-1.5 rounded" style={{ background: 'var(--color-border)', width: '75%' }} />
                        <div className="h-1.5 rounded" style={{ background: 'var(--color-border)', width: count === 3 ? '60%' : '45%' }} />
                        {count === 3 && <div className="h-1.5 rounded" style={{ background: 'var(--color-border)', width: '35%' }} />}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center text-sm mt-2">{count === 2 ? 'Двухстрочный' : 'Трёхстрочный'}</div>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Цветовая тема">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Дневная тема</div>
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Переключить на светлую</div>
            </div>
            <Toggle on={s.lightTheme} onChange={v => s.set({ lightTheme: v })} />
          </div>
          <button className="btn-accent w-full flex items-center justify-center gap-2" onClick={() => navigate('/themes')}>
            <Palette size={18} /> Настройки темы
          </button>
        </Section>

        <Section title="Иконка приложения">
          <div className="grid grid-cols-4 gap-2">
            {APP_ICONS.map(ic => (
              <button key={ic.src} className="rounded-xl border p-3 flex flex-col items-center gap-2"
                style={{
                  borderColor: s.appIcon === ic.src ? 'var(--color-accent)' : 'var(--color-border)',
                  background: 'var(--color-background-secondary)',
                }}
                onClick={() => s.set({ appIcon: s.appIcon === ic.src ? null : ic.src })}>
                <img src={ic.src} alt={ic.label} className="w-12 h-12 rounded-xl object-contain"
                  onError={e => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none'; }} />
                <span className="text-xs">{ic.label}</span>
              </button>
            ))}
          </div>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Иконки из файлов проекта — применяются сразу во вкладке и на домашнем экране.
          </p>
        </Section>

        <Section title="Поведение и звук">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Отправка по Enter</div>
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Иначе — только кнопкой</div>
            </div>
            <Toggle on={s.enterToSend} onChange={v => s.set({ enterToSend: v })} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Анимации</div>
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Экономия заряда при выключении</div>
            </div>
            <Toggle on={s.animations} onChange={v => s.set({ animations: v })} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Звук сообщений</div>
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Сигнал при новом сообщении</div>
            </div>
            <Toggle on={n.sound} onChange={v => { n.set({ sound: v }); if (v) playBeep(); }} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Автозагрузка медиа</div>
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Картинки грузятся сами</div>
            </div>
            <Toggle on={n.autodownload} onChange={v => n.set({ autodownload: v })} />
          </div>
        </Section>
      </div>
    </div>
  );
}

import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, RotateCcw } from 'lucide-react';
import { useChatSettings } from '../store/chatSettings.store';
import { api } from '../utils/api';

export default function StylePage() {
  const navigate = useNavigate();
  const s = useChatSettings();
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
        <div className="font-bold">Оформление</div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 w-full max-w-2xl mx-auto">
        <section className="space-y-3">
          <h2 className="font-bold">Обои чата</h2>
          <div className="h-40 rounded-2xl border chat-wallpaper" style={{ borderColor: 'var(--color-border)' }} />
          <input ref={fileRef} type="file" accept="image/*" hidden
            onChange={e => { const f = e.target.files?.[0]; if (f) pickWallpaper(f); e.target.value = ''; }} />
          <div className="flex gap-2">
            <button className="btn-accent flex-1" disabled={uploading} onClick={() => fileRef.current?.click()}>
              <ImageIcon size={18} /> {uploading ? 'Загрузка…' : 'Выбрать из галереи'}
            </button>
            {s.wallpaper && (
              <button className="btn-accent" style={{ background: 'var(--color-surface)', boxShadow: 'none' }}
                onClick={() => s.set({ wallpaper: null })}>
                <RotateCcw size={18} />
              </button>
            )}
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold">Размер текста: {s.fontSize}px</h2>
          <input type="range" min={12} max={22} className="w-full" value={s.fontSize}
            onChange={e => s.set({ fontSize: Number(e.target.value) })} />
        </section>

        <section className="space-y-2">
          <h2 className="font-bold">Скругление пузырей: {s.bubbleRadius}px</h2>
          <input type="range" min={0} max={28} className="w-full" value={s.bubbleRadius}
            onChange={e => s.set({ bubbleRadius: Number(e.target.value) })} />
        </section>

        <section className="space-y-2">
          <h2 className="font-bold">Цвет имён</h2>
          <input type="color" value={s.nameColor} onChange={e => s.set({ nameColor: e.target.value })} />
        </section>

        <section className="space-y-3">
          <label className="flex items-center justify-between">
            <span>Отправка по Enter</span>
            <input type="checkbox" checked={s.enterToSend} onChange={e => s.set({ enterToSend: e.target.checked })} />
          </label>
          <label className="flex items-center justify-between">
            <span>Анимации</span>
            <input type="checkbox" checked={s.animations} onChange={e => s.set({ animations: e.target.checked })} />
          </label>
          <label className="flex items-center justify-between">
            <span>Строк в списке чатов</span>
            <select className="nexus-input !w-auto" value={s.listLines}
              onChange={e => s.set({ listLines: Number(e.target.value) as 2 | 3 })}>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </label>
        </section>
      </div>
    </div>
  );
}

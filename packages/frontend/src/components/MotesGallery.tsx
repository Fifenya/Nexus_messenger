import React, { useEffect, useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { api } from '../utils/api';

export default function MotesGallery({ onClose, onPick }: { onClose: () => void; onPick: (url: string) => void }) {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    api.get('/motes/gallery').then(r => setItems(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const del = async (id: string) => {
    await api.delete(`/motes/gallery/${id}`).catch(() => {});
    setItems(s => s.filter(x => x.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[80vh] flex flex-col rounded-2xl overflow-hidden"
        style={{ background: 'var(--color-surface)' }} onClick={e => e.stopPropagation()}>
        <header className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="font-bold text-lg flex-1">Галерея мотов 🐈</div>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </header>
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          {items.map(m => (
            <div key={m.id} className="relative group rounded-lg overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
              <img src={m.url} alt={m.name} className="w-full aspect-square object-cover cursor-pointer" onClick={() => { onPick(m.url); onClose(); }} />
              <button className="absolute top-1 right-1 icon-btn opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => del(m.id)}><Trash2 size={16} /></button>
            </div>
          ))}
          {items.length === 0 && (
            <div className="col-span-full text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
              Пока пусто. Сохраняй картинки в мотах — они появятся здесь.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

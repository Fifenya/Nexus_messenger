import React, { useRef, useState } from 'react';

export default function AvatarCropModal({ file, onDone, onClose }: {
  file: File; onDone: (blob: Blob) => void; onClose: () => void;
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinch = useRef<{ d: number; s: number } | null>(null);
  const P = 260;

  React.useEffect(() => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => setImg(im);
    im.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), s: scale };
    }
  };
  const onMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    const prev = pointers.current.get(e.pointerId)!;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      setPos(p => ({ x: p.x + (e.clientX - prev.x), y: p.y + (e.clientY - prev.y) }));
    } else if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      setScale(Math.min(4, Math.max(1, pinch.current.s * (d / pinch.current.d))));
    }
  };
  const onUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };

  const save = () => {
    if (!img) return;
    const OUT = 512;
    const canvas = document.createElement('canvas');
    canvas.width = OUT; canvas.height = OUT;
    const ctx = canvas.getContext('2d')!;
    const base = Math.max(P / img.width, P / img.height);
    const k = OUT / P;
    const dW = img.width * base * scale * k;
    const dH = img.height * base * scale * k;
    const dx = (P / 2 - (img.width * base * scale) / 2 + pos.x) * k;
    const dy = (P / 2 - (img.height * base * scale) / 2 + pos.y) * k;
    ctx.drawImage(img, dx, dy, dW, dH);
    canvas.toBlob(b => b && onDone(b), 'image/png');
  };

  const base = img ? Math.max(P / img.width, P / img.height) : 1;
  const w = img ? img.width * base * scale : 0;
  const h = img ? img.height * base * scale : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl p-4 space-y-4" style={{ background: 'var(--color-surface)' }} onClick={e => e.stopPropagation()}>
        <div className="font-bold text-center">Расположи фото</div>
        <div
          className="mx-auto rounded-full overflow-hidden relative touch-none select-none"
          style={{ width: P, height: P, background: 'var(--color-background)', cursor: 'grab', boxShadow: '0 0 0 3px var(--color-accent)' }}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          {img && (
            <img src={img.src} alt="" draggable={false} className="absolute max-w-none"
              style={{ width: w, height: h, left: P / 2 - w / 2 + pos.x, top: P / 2 - h / 2 + pos.y }} />
          )}
        </div>
        <div className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
          Перетаскивай пальцем · щипок — зум
        </div>
        <div className="flex gap-2">
          <button className="btn-accent flex-1" style={{ background: 'var(--color-surface)', boxShadow: 'none', color: 'var(--color-text)', border: '1px solid var(--color-border)' }} onClick={onClose}>Отмена</button>
          <button className="btn-accent flex-1" onClick={save} disabled={!img}>Сохранить</button>
        </div>
      </div>
    </div>
  );
}

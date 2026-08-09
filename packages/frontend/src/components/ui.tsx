import React from 'react';

const GRADS: [string, string][] = [
  ['#ff8a7a', '#e0234a'], ['#ffb26b', '#e05a2b'], ['#ff7ab8', '#c22b6b'],
  ['#b18cff', '#6a2bd9'], ['#7ad0ff', '#2b7de0'], ['#7affc4', '#1fa06a'],
];

export function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Avatar({ name, imageUrl, size = 48, online }:
  { name: string; imageUrl?: string; size?: number; online?: boolean }) {
  const g = GRADS[hashStr(name || 'x') % GRADS.length];
  const initials = (name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="w-full h-full rounded-full object-cover" />
      ) : (
        <div className="w-full h-full rounded-full flex items-center justify-center font-bold text-white select-none"
          style={{ backgroundImage: `linear-gradient(135deg, ${g[0]}, ${g[1]})`, fontSize: size * 0.36 }}>
          {initials}
        </div>
      )}
      {online && (
        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
          style={{ background: 'var(--color-success)', borderColor: 'var(--color-background-secondary)' }} />
      )}
    </div>
  );
}

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <div className="rounded-[30%] flex items-center justify-center font-black text-white select-none"
      style={{
        width: size, height: size, fontSize: size * 0.5,
        backgroundImage: 'linear-gradient(135deg, #ff6a5e, #dc2626 55%, #7f101d)',
        boxShadow: '0 6px 20px color-mix(in srgb, var(--color-accent) 40%, transparent)',
      }}>
      N
    </div>
  );
}

export const fmtTime = (d: string) =>
  new Date(d).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

export const fmtListTime = (d?: string) => {
  if (!d) return '';
  const dt = new Date(d);
  if (dt.toDateString() === new Date().toDateString()) return fmtTime(d);
  return dt.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
};

export const dayLabel = (d: string) => {
  const dt = new Date(d), now = new Date(), yest = new Date(now.getTime() - 864e5);
  if (dt.toDateString() === now.toDateString()) return 'Сегодня';
  if (dt.toDateString() === yest.toDateString()) return 'Вчера';
  return dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
};

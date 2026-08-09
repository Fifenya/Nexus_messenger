import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AtSign, Camera, Eye, Pencil, Settings } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { api } from '../utils/api';
import { Avatar } from '../components/ui';
import BottomNav from '../components/BottomNav';

export default function MePage() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const updateUser = useAuthStore(s => s.updateUser);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadAvatar = async (f: File) => {
    try {
      const form = new FormData();
      form.append('file', f);
      const r = await api.post('/uploads', form);
      const url = r.data?.url || r.data;
      await api.patch('/users/me', { avatarUrl: url });
      updateUser({ avatarUrl: url });
    } catch (e) { console.error(e); }
  };

  const tile = 'rounded-2xl border p-3 flex flex-col items-center gap-2 text-sm font-semibold';
  const tileStyle = { background: 'var(--color-surface)', borderColor: 'var(--color-border)' };

  return (
    <div className="h-[100dvh] overflow-y-auto chat-wallpaper pb-24">
      <div className="flex flex-col items-center gap-2 pt-8 px-4">
        <div className="relative">
          <Avatar name={user?.displayName || user?.username || '?'} imageUrl={user?.avatarUrl} size={110} online />
          <input ref={fileRef} type="file" accept="image/*" hidden
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); e.target.value = ''; }} />
          <button className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full flex items-center justify-center text-white border-4"
            style={{ background: 'var(--color-accent)', borderColor: 'var(--color-background)' }}
            title="Выбрать фото" onClick={() => fileRef.current?.click()}>
            <Camera size={16} />
          </button>
        </div>
        <div className="text-2xl font-extrabold mt-2">{user?.displayName || user?.username}</div>
        <div className="text-sm" style={{ color: 'var(--color-accent-hover)' }}>в сети</div>

        <div className="grid grid-cols-3 gap-2 w-full max-w-md mt-5">
          <button className={tile} style={tileStyle} onClick={() => fileRef.current?.click()}>
            <Camera size={20} /> Фото
          </button>
          <button className={tile} style={tileStyle} onClick={() => user && navigate(`/user/${user.id}`)}>
            <Eye size={20} /> Со стороны
          </button>
          <button className={tile} style={tileStyle} onClick={() => navigate('/settings')}>
            <Settings size={20} /> Настройки
          </button>
        </div>

        <div className="w-full max-w-md rounded-2xl border p-4 mt-3 space-y-2" style={tileStyle}>
          <div className="flex items-center gap-2 text-sm">
            <AtSign size={14} style={{ color: 'var(--color-text-muted)' }} />
            <span>{user?.username}</span>
          </div>
          <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {user?.bio || 'Расскажи о себе в настройках — это увидят друзья.'}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AtSign, MessageSquare, User as UserIcon } from 'lucide-react';
import { api } from '../utils/api';
import { Avatar } from '../components/ui';

export default function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [u, setU] = useState<any>(null);

  useEffect(() => {
    api.get(`/users/${id}`).then(r => setU(r.data)).catch(console.error);
  }, [id]);

  const startChat = async () => {
    try {
      const r = await api.post('/chats', { type: 'PRIVATE', memberIds: [id] });
      if (r.data?.id) navigate(`/chat/${r.data.id}`);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="h-[100dvh] overflow-y-auto chat-wallpaper">
      <header className="flex items-center gap-3 px-3 py-2.5 border-b sticky top-0 z-10"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-background-secondary)' }}>
        <button className="icon-btn" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <div className="font-bold text-lg">Профиль</div>
      </header>

      <div className="max-w-2xl mx-auto p-6 flex flex-col items-center gap-4 text-center">
        <Avatar name={u?.displayName || u?.username || '?'} imageUrl={u?.avatarUrl} size={110}
          online={u?.onlineStatus === 'online'} />
        <div>
          <div className="text-2xl font-extrabold">{u?.displayName || u?.username || '…'}</div>
          <div className="text-sm mt-1 flex items-center justify-center gap-1"
            style={{ color: 'var(--color-text-muted)' }}>
            <AtSign size={14} /> {u?.username}
          </div>
        </div>

        {u?.bio && (
          <div className="rounded-2xl border p-4 w-full text-sm leading-relaxed"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
            {u.bio}
          </div>
        )}

        <button className="btn-accent w-full max-w-xs" onClick={startChat}>
          <MessageSquare size={18} /> Написать
        </button>
      </div>
    </div>
  );
}

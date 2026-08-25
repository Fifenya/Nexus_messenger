import React, { useRef,  useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AvatarCropModal from '../components/AvatarCropModal';
import { ArrowLeft, Users, Image, Video, FileText, Music, Mic, Link as LinkIcon, Sparkles, Camera } from 'lucide-react';
import { api } from '../utils/api';
import { Avatar } from '../components/ui';

type Tab = 'members' | 'media' | 'videos' | 'files' | 'music' | 'voices' | 'gifs' | 'links';

export default function GroupProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);

  const [cropFile, setCropFile] = useState(null);
  const avRef = useRef<HTMLInputElement>(null);

  const onAvatarDone = async (blob) => {
    setCropFile(null);
    try {
      const form = new FormData();
      form.append('file', new File([blob], 'avatar.png', { type: 'image/png' }));
      const r = await api.post('/uploads', form);
      const url = r.data?.url || r.data;
      await api.patch(`/chats/${id}/avatar`, { avatarUrl: url });
      setProfile((p) => ({ ...p, avatarUrl: url }));
    } catch (e) { console.error(e); }
  };
  const [tab, setTab] = useState<Tab>('members');

  useEffect(() => {
    api.get(`/chats/${id}/profile`).then(r => setProfile(r.data)).catch(console.error);
  }, [id]);

  if (!profile) return <div className="h-screen flex items-center justify-center">Загрузка…</div>;

  const tabs: { key: Tab; label: string; icon: any; count: number }[] = [
    { key: 'members', label: 'Участники', icon: Users, count: profile.members.length },
    { key: 'media', label: 'Медиа', icon: Image, count: profile.media.length },
    { key: 'videos', label: 'Видео', icon: Video, count: profile.videos.length },
    { key: 'files', label: 'Файлы', icon: FileText, count: profile.files.length },
    { key: 'music', label: 'Музыка', icon: Music, count: profile.music.length },
    { key: 'voices', label: 'Голосовые', icon: Mic, count: profile.voices.length },
    { key: 'gifs', label: 'GIF', icon: Sparkles, count: profile.gifs.length },
    { key: 'links', label: 'Ссылки', icon: LinkIcon, count: profile.links.length },
  ];

  const muted: React.CSSProperties = { color: 'var(--color-text-muted)' };

  return (
    <div className="h-[100dvh] flex flex-col">
      <header className="flex items-center gap-3 px-3 py-2.5 border-b"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-background-secondary)' }}>
        <button className="icon-btn" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <div className="font-bold">Профиль группы</div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Шапка профиля */}
        <div className="flex flex-col items-center gap-3 p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="relative">
              <Avatar name={profile.title || 'Группа'} imageUrl={profile.avatarUrl} size={96} />
              <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-white active:scale-90"
                style={{ background: 'var(--color-accent)' }} onClick={() => avRef.current?.click()}>
                <Camera size={16} />
              </button>
              <input ref={avRef} type="file" accept="image/*" hidden
                onChange={e => { const f = e.target.files?.[0]; if (f) setCropFile(f); e.target.value = ''; }} />
            </div>
            {cropFile && <AvatarCropModal file={cropFile} onDone={onAvatarDone} onClose={() => setCropFile(null)} />}
          <div className="text-center">
            <div className="text-xl font-bold">{profile.title || 'Группа'}</div>
            <div className="text-sm" style={muted}>
              {profile.members.length} {profile.members.length === 1 ? 'участник' : 'участников'}
            </div>
          </div>
        </div>

        {/* Табы */}
        <div className="flex overflow-x-auto border-b" style={{ borderColor: 'var(--color-border)' }}>
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm whitespace-nowrap transition-colors"
                style={{
                  color: tab === t.key ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  borderBottom: tab === t.key ? '2px solid var(--color-accent)' : '2px solid transparent'
                }}
              >
                <Icon size={16} />
                <span className="font-semibold">{t.label}</span>
                <span className="text-xs opacity-60">{t.count}</span>
              </button>
            );
          })}
        </div>

        {/* Контент таба */}
        <div className="p-4">
          {tab === 'members' && (
            <div className="space-y-2">
              {profile.members.map((m: any) => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--color-surface)' }}>
                  <Avatar name={m.displayName || m.username} imageUrl={m.avatarUrl} online={m.onlineStatus === 'online'} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{m.displayName || m.username}</div>
                    <div className="text-xs" style={muted}>
                      @{m.username} · {m.role === 'OWNER' ? 'Владелец' : m.role === 'ADMIN' ? 'Админ' : 'Участник'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'media' && (
            <div className="grid grid-cols-3 gap-2">
              {profile.media.map((m: any) => (
                <a key={m.id} href={m.url} target="_blank" rel="noreferrer" className="aspect-square rounded-lg overflow-hidden">
                  <img src={m.url} alt="" className="w-full h-full object-cover" />
                </a>
              ))}
              {profile.media.length === 0 && <div style={muted}>Медиа пока нет</div>}
            </div>
          )}

          {tab === 'videos' && (
            <div className="space-y-2">
              {profile.videos.map((v: any) => (
                <div key={v.id} className="rounded-xl overflow-hidden" style={{ background: 'var(--color-surface)' }}>
                  <video src={v.url} controls className="w-full" />
                  <div className="p-2 text-xs" style={muted}>
                    Отправил {v.message.sender?.displayName || v.message.sender?.username}
                  </div>
                </div>
              ))}
              {profile.videos.length === 0 && <div style={muted}>Видео пока нет</div>}
            </div>
          )}

          {tab === 'files' && (
            <div className="space-y-2">
              {profile.files.map((f: any) => (
                <a key={f.id} href={f.url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'var(--color-surface)' }}>
                  <FileText size={24} style={{ color: 'var(--color-accent)' }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{f.url.split('/').pop()}</div>
                    <div className="text-xs" style={muted}>
                      {f.size ? `${(f.size / 1024).toFixed(1)} КБ` : ''}
                    </div>
                  </div>
                </a>
              ))}
              {profile.files.length === 0 && <div style={muted}>Файлов пока нет</div>}
            </div>
          )}

          {tab === 'music' && (
            <div className="space-y-2">
              {profile.music.map((m: any) => (
                <div key={m.id} className="p-3 rounded-xl" style={{ background: 'var(--color-surface)' }}>
                  <div className="flex items-center gap-3 mb-2">
                    <Music size={20} style={{ color: 'var(--color-accent)' }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{m.url.split('/').pop()}</div>
                      <div className="text-xs" style={muted}>
                        Отправил {m.message.sender?.displayName || m.message.sender?.username}
                      </div>
                    </div>
                  </div>
                  <audio src={m.url} controls className="w-full" />
                </div>
              ))}
              {profile.music.length === 0 && <div style={muted}>Музыки пока нет</div>}
            </div>
          )}

          {tab === 'voices' && (
            <div className="space-y-2">
              {profile.voices.map((v: any) => (
                <div key={v.id} className="p-3 rounded-xl" style={{ background: 'var(--color-surface)' }}>
                  <div className="flex items-center gap-3 mb-2">
                    <Mic size={20} style={{ color: 'var(--color-accent)' }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold">Голосовое сообщение</div>
                      <div className="text-xs" style={muted}>
                        {v.duration ? `${Math.floor(v.duration / 60)}:${(v.duration % 60).toString().padStart(2, '0')}` : ''}
                      </div>
                    </div>
                  </div>
                  <audio src={v.url} controls className="w-full" />
                </div>
              ))}
              {profile.voices.length === 0 && <div style={muted}>Голосовых пока нет</div>}
            </div>
          )}

          {tab === 'gifs' && (
            <div className="grid grid-cols-3 gap-2">
              {profile.gifs.map((g: any) => (
                <a key={g.id} href={g.url} target="_blank" rel="noreferrer" className="aspect-square rounded-lg overflow-hidden">
                  <img src={g.url} alt="" className="w-full h-full object-cover" />
                </a>
              ))}
              {profile.gifs.length === 0 && <div style={muted}>GIF пока нет</div>}
            </div>
          )}

          {tab === 'links' && (
            <div className="space-y-2">
              {profile.links.map((l: any, i: number) => (
                <a key={i} href={l.url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'var(--color-surface)' }}>
                  <LinkIcon size={20} style={{ color: 'var(--color-accent)' }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{l.url}</div>
                    <div className="text-xs" style={muted}>
                      Отправил {l.message.sender?.displayName || l.message.sender?.username}
                    </div>
                  </div>
                </a>
              ))}
              {profile.links.length === 0 && <div style={muted}>Ссылок пока нет</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

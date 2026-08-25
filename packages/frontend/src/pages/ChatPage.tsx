import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCheck, ChevronDown, Clock, Copy, Download, Eye, FileText, Image as ImageIcon, Music, Paperclip, Pencil, Send, Trash2, Video, X } from 'lucide-react';
import { formatLastSeen } from "../lib/time";
import { api } from '../utils/api';
import { useAuthStore } from '../store/auth.store';
import { getSocket } from '../lib/socket';
import { usePresenceStore } from '../store/presence.store';
import { useNotifySettings } from '../store/notify.store';
import VideoPlayer from '../components/VideoPlayer';
import ChatSidebar from '../components/ChatSidebar';
import MotesGallery from '../components/MotesGallery';
import { Avatar, dayLabel, fmtTime } from '../components/ui';

const EMOJIS = [
  0x1F614,0x1F440,0x1F44D,0x1F525,0x1F389,0x1F914,0x1F44C,0x2764,
  0x1F44E,0x1F970,0x1F44F,0x1F604,0x1F92F,0x1F631,0x1F92C,0x1F929,
  0x1F973,0x1F4A9,0x1F64F,0x1F54A,0x1F921,0x1F92D,0x1F60F,0x1F60D,
  0x1F433,0x1F31A,0x1F32D,0x1F4AF,0x1F923,0x26A1,0x1F34C,0x1F3C6,
  0x1F494,0x1F928,0x1F610,0x1F353,0x1F37E,0x1F48B,0x261D,0x1F608,
  0x1F634,0x1F62D,0x1F913,0x1F47B,0x1F64B,0x1F383,0x1F648,0x1F607,
  0x1F628,0x1F976,0x1F919,0x1F60A,0x1F63B,0x1F385,0x1F384,0x26C4,
  0x1F485,0x1F92A,0x1F5FF,0x1F498,0x1F412,0x1F984,0x1F642,0x1F48A,
  0x1F435,0x1F60E,0x1F47E,0x1F937,0x1F926,0x1F621,0x270D,0x1F622,
  0x1F602,0x1F978,0x1F618,0x1F917,0x1F975,0x1F605,0x1F643,0x2639,
  0x1F92B,0x1F636,0x1F916,0x1F480,0x1F47D,0x1F920,0x1F44B,0x1F91D,
  0x1F382,0x1F355,0x2615,0x1F308,0x2B50,0x1F319,0x1F97A,0x1F64C,
].map(c => {
  const base = String.fromCodePoint(c);
  return [0x2764, 0x261D, 0x2639, 0x270D, 0x26A1, 0x26C4, 0x2615, 0x2B50].includes(c) ? base + '\uFE0F' : base;
});

const fmtSize = (n?: number) => !n ? '' : n < 1024 * 1024 ? (n / 1024).toFixed(1) + ' КБ' : (n / 1024 / 1024).toFixed(1) + ' МБ';

const pluralViews = (n: number) => {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'просмотр';
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'просмотра';
  return 'просмотров';
};

function safeName(u?: string) {
  if (!u) return 'файл';
  try { return decodeURIComponent(u.split('/').pop() || 'файл'); } catch { return u.split('/').pop() || 'файл'; }
}

const mediaCache = new Map<string, string>();

function DownloadButton({ progress, loading, onClick }: any) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button type="button" onClick={onClick}
        className="relative overflow-hidden rounded-full flex items-center justify-center active:scale-95 transition-transform"
        style={{ width: 56, height: 56, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}>
        <span className="absolute left-0 right-0 bottom-0"
          style={{
            height: `${Math.round(progress * 100)}%`,
            background: 'color-mix(in srgb, var(--color-accent) 85%, transparent)',
            transition: 'height .12s linear',
          }} />
        <Download size={22} className="relative text-white drop-shadow" />
      </button>
      {loading && progress < 1 && (
        <span className="text-[11px] font-semibold text-white" style={{ textShadow: '0 1px 4px rgba(0,0,0,.8)' }}>
          {Math.round(progress * 100)}%
        </span>
      )}
    </div>
  );
}

function AttachmentView({ att }: any) {
  const auto = useNotifySettings(st => st.autodownload);
  const [objUrl, setObjUrl] = useState<string | undefined>(att?.url ? mediaCache.get(att.url) : undefined);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  if (!att || !att.url) return null;
  const url = att.url;
  const isImg = att.type === 'image' || /\.(png|jpe?g|gif|webp)$/i.test(url);
  const isVid = att.type === 'video' || /\.(mp4|webm|mov)$/i.test(url);
  const isAud = att.type === 'voice' || (att.mimeType || '').startsWith('audio/');
  const name = safeName(url);
  const lazy = !auto && (isImg || isVid || isAud);
  const src = auto ? url : (objUrl || mediaCache.get(url));

  const download = () => {
    if (loading) return;
    setLoading(true); setProgress(0);
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.onprogress = e => { if (e.lengthComputable) setProgress(e.loaded / e.total); };
    xhr.onload = () => {
      const b = URL.createObjectURL(xhr.response);
      mediaCache.set(url, b);
      setObjUrl(b); setLoading(false); setProgress(1);
    };
    xhr.onerror = () => { setLoading(false); setProgress(0); };
    xhr.send();
  };

  const btn = <DownloadButton progress={progress} loading={loading} onClick={download} />;

  if (isImg) {
    if (!lazy || src) return <img src={src} alt="" className="rounded-lg max-w-full mb-1" />;
    return (
      <div className="relative rounded-lg mb-1 overflow-hidden flex items-center justify-center"
        style={{
          width: 260, maxWidth: '100%', height: 260,
          background: 'radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--color-accent) 22%, transparent), transparent 65%), radial-gradient(circle at 75% 70%, color-mix(in srgb, var(--color-text) 18%, transparent), transparent 55%), color-mix(in srgb, var(--color-text) 8%, transparent)',
          filter: 'blur(0.5px)',
        }}>
        {btn}
      </div>
    );
  }
  if (isVid) {
    if (!lazy || src) return <VideoPlayer src={src} />;
    return (
      <div className="relative rounded-lg mb-1 overflow-hidden flex items-center justify-center"
        style={{ width: 260, maxWidth: '100%', height: 180, background: 'color-mix(in srgb, var(--color-text) 10%, transparent)' }}>
        {btn}
      </div>
    );
  }
  if (isAud) {
    if (!lazy || src) return <audio src={src} controls className="max-w-full mb-1" />;
    return (
      <div className="flex items-center justify-center rounded-lg mb-1 px-3 py-2"
        style={{ background: 'color-mix(in srgb, var(--color-text) 10%, transparent)', width: 200, height: 76 }}>
        {btn}
      </div>
    );
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-2 py-1.5 mb-1"
      style={{ background: 'color-mix(in srgb, var(--color-text) 10%, transparent)' }}>
      <FileText size={20} />
      <span className="text-sm underline truncate" style={{ maxWidth: 180 }}>{name}</span>
    </a>
  );
}

export default function ChatPage() {
  const { id: chatId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [chat, setChat] = useState<any>(null);
  const [text, setText] = useState('');
  const [editing, setEditing] = useState<any>(null);
  const [menu, setMenu] = useState<any>(null);
  const [typing, setTyping] = useState(false);
  const [gallery, setGallery] = useState(false);
  const user = useAuthStore(s => s.user);
  const socketRef = useRef<any>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastTyping = useRef(0);
  const holdTimer = useRef<any>(null);

  const refresh = () =>
   api.get(`/chats/${chatId}/messages`)
    .then(r => { const list = Array.isArray(r.data) ? r.data : []; setMessages(list); sendViews(list); })
    .catch(() => {});

  useEffect(() => {
    refresh();
    api.get('/chats').then(r => setChat((Array.isArray(r.data) ? r.data : []).find((c: any) => c.id === chatId))).catch(() => {});

    const socket = getSocket();
    if (!socket) return;
    socketRef.current = socket;
    socket.emit('chat:join', { chatId });

    const onNew = (msg: any) => {
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
      sendViews([msg]);
      if (msg?.senderId !== user?.id) (window as any).__nexusNotify?.('Nexus', msg?.text || 'Новое сообщение');
    };
    const onTyping = (p: any) => {
      if (p?.userId && p.userId !== user?.id) {
        setTyping(!!p.isTyping);
        if (p.isTyping) setTimeout(() => setTyping(false), 2500);
      }
    };
    socket.on('message:new', onNew);
    socket.on('message:updated', refresh);
    socket.on('message:deleted', refresh);
    socket.on('message:reaction', refresh);
    socket.on('typing:update', onTyping);
    return () => {
      socket.off('message:new', onNew);
      socket.off('message:updated', refresh);
      socket.off('message:deleted', refresh);
      socket.off('message:reaction', refresh);
      socket.off('typing:update', onTyping);
    };
  }, [chatId]);

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }); }, [messages.length, typing]);

  const peer = chat?.type === 'PRIVATE'
    ? (chat?.members || []).map((m: any) => m.user).find((u: any) => u && u.id !== user?.id)
    : null;
  const title = chat?.title || peer?.displayName || peer?.username || 'Чат';
  const isMotes = chat?.type === 'MOTES';

  const peerOnline = usePresenceStore(s => !!(peer?.id && s.online.has(peer.id)));
  const peerLastSeen = usePresenceStore(s => (peer?.id ? s.lastSeen[peer.id] : null));
  const peerStatus = peerOnline
    ? 'в сети'
    : peerLastSeen
      ? formatLastSeen(peerLastSeen)
      : peer?.onlineStatus === 'online'
        ? 'в сети'
        : peer?.lastSeenAt
          ? formatLastSeen(peer.lastSeenAt)
          : 'был(а) недавно';

  const send = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() && !pending) return;
    if (editing) {
      api.patch(`/messages/${editing.id}`, { text: text.trim() }).then(refresh).catch(console.error);
      setEditing(null);
    } else if (pending) {
      socketRef.current?.emit('message:send', {
        chatId,
        text: text.trim() || undefined,
        attachments: [{ type: pending.type, url: pending.url, size: pending.size, mimeType: pending.mimeType }],
      });
      setPending(null);
    } else {
      socketRef.current?.emit('message:send', { chatId, text: text.trim() });
    }
    setText('');
    if (taRef.current) taRef.current.style.height = 'auto';
  };

  const onInput = (v: string) => {
    setText(v);
    const now = Date.now();
    if (now - lastTyping.current > 1500) { socketRef.current?.emit('typing:start', { chatId }); lastTyping.current = now; }
  };

  const react = (msg: any, emoji: string) => {
    api.post(`/messages/${msg.id}/reactions`, { emoji }).then(refresh).catch(console.error);
    setMenu(null);
  };

  const del = (msg: any) => {
    api.delete(`/messages/${msg.id}`).then(refresh).catch(console.error);
    setMenu(null);
  };

  const [pending, setPending] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const processingFile = useRef(false);

  const pickFile = async (f: File) => {
    if (processingFile.current) return; // защита от повторного вызова
    processingFile.current = true;
    setUploading(true);
    setUploadProgress(0);
    try {
      const form = new FormData();
      form.append('file', f);
      const r = await api.post('/uploads', form, {
        onUploadProgress: e => { if (e.total) setUploadProgress(e.loaded / e.total); },
      });
      const d = r.data || {};
      const url = d.url || d;
      const mime = d.mimeType || f.type || '';
      const type = mime.startsWith('image/') ? 'image' : mime.startsWith('video/') ? 'video' : mime.startsWith('audio/') ? 'voice' : 'file';
      setPending({ url, name: f.name, size: d.size ?? f.size, type, mimeType: mime });
    } catch (e) { console.error(e); setPending(null); }
    finally {
      setUploading(false);
      setUploadProgress(0);
      processingFile.current = false;
    }
  };

  const pickFromGallery = (url: string) => {
    socketRef.current?.emit('message:send', { chatId, text: '', attachments: [{ type: 'image', url }] });
  };

  const groupReactions = (msg: any) => {
    const arr = Array.isArray(msg.reactions) ? msg.reactions : [];
    const grouped: Record<string, any[]> = {};
    arr.forEach((r: any) => { const e = r?.emoji; if (!e) return; (grouped[e] ||= []).push(r.user); });
    return Object.entries(grouped);
  };

  const viewsSent = useRef<Set<string>>(new Set());
  const [menuViews, setMenuViews] = useState<any[]>([]);
  const [viewsOpen, setViewsOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const sendViews = (list: any[]) => {
    const ids = list.map(m => m.id).filter(id => !viewsSent.current.has(id));
    if (!ids.length) return;
    ids.forEach(id => viewsSent.current.add(id));
    api.post('/messages/view', { messageIds: ids }).catch(() => {});
  };

  useEffect(() => {
    if (menu && menu.senderId === user?.id) {
      api.get(`/messages/${menu.id}/views`).then(r => setMenuViews(Array.isArray(r.data) ? r.data : [])).catch(() => setMenuViews([]));
    } else setMenuViews([]);
  }, [menu]);

  const [recents, setRecents] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('nexus-recent-emojis') || '[]'); } catch { return []; }
  });
  const pushRecent = (e: string) => {
    setRecents(prev => {
      const next = [e, ...prev.filter(x => x !== e)].slice(0, 8);
      localStorage.setItem('nexus-recent-emojis', JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="h-[100dvh] flex">
      <div className="hidden lg:block h-full"><ChatSidebar activeId={chatId} /></div>

      <main className="flex-1 flex flex-col h-full min-w-0">
        <header className="flex items-center gap-3 px-3 py-2.5 border-b z-10"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-background-secondary)' }}>
          <button className="icon-btn lg:hidden" onClick={() => navigate('/')}><ArrowLeft size={20} /></button>
          <button className="flex items-center gap-3 min-w-0 flex-1" onClick={() => {
            if (chat?.type === 'GROUP') navigate(`/group-profile/${chatId}`);
            else if (peer) navigate(`/user/${peer.id}`);
          }}>
            <Avatar name={title} imageUrl={chat?.avatarUrl || (isMotes ? '/notes.png' : peer?.avatarUrl)} size={40}
              online={peerOnline || peer?.onlineStatus === 'online'} />
            <div className="text-left min-w-0">
              <div className="font-bold truncate leading-tight">{title}</div>
              <div className="text-xs truncate" style={{ color: typing ? 'var(--color-accent-hover)' : 'var(--color-text-muted)' }}>
                {typing ? 'печатает…' : (chat?.type === 'GROUP' ? `${chat?.members?.length || 0} участников` : isMotes ? 'твоё личное пространство' : peerStatus)}
              </div>
            </div>
          </button>
          {isMotes && (
            <button className="icon-btn" onClick={() => setGallery(true)} title="Галерея мотов">
              <ImageIcon size={20} />
            </button>
          )}
        </header>

        <div ref={listRef} className="flex-1 overflow-y-auto chat-wallpaper wp-custom px-3 md:px-8 py-4 flex flex-col gap-1.5">
          {messages.map((msg, i) => {
            const own = msg.senderId === user?.id;
            const isGroup = chat?.type === 'GROUP';
            const senderUser = chat?.members?.find((m: any) => m.userId === msg.senderId)?.user || msg.sender;
            const senderName = senderUser?.displayName || senderUser?.username || '…';
            const prev = messages[i - 1];
            const newDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(msg.createdAt).toDateString();
            return (
              <React.Fragment key={msg.id}>
                {newDay && <div className="date-chip my-2">{dayLabel(msg.createdAt)}</div>}
                <div className={`flex items-end gap-2 ${own ? 'justify-end' : 'justify-start'}`}>
                  {!own && isGroup && (
                    <Avatar name={senderName} imageUrl={senderUser?.avatarUrl} size={36} />
                  )}
                  <div className={`bubble ${own ? 'bubble-out' : 'bubble-in'} ${((Array.isArray(msg.attachments) && msg.attachments.length) || msg.attachmentUrl) && !msg.text ? 'bubble-media' : ''}`}
                    onContextMenu={e => { e.preventDefault(); setMenu(msg); }}
                    onTouchStart={() => { holdTimer.current = setTimeout(() => setMenu(msg), 450); }}
                    onTouchEnd={() => clearTimeout(holdTimer.current)}
                    onTouchMove={() => clearTimeout(holdTimer.current)}
                    onClick={() => { setMenu(msg); setPickerOpen(false); }}>
                    {!own && isGroup && (
                      <span className="block font-semibold mb-0.5" style={{ color: 'var(--name-color)', fontSize: '0.85em' }}>{senderName}</span>
                    )}
                    {(Array.isArray(msg.attachments) ? msg.attachments : msg.attachmentUrl ? [{ type: 'file', url: msg.attachmentUrl }] : [])
                      .filter((a: any) => a?.url)
                      .map((att: any, ai: number) => <AttachmentView key={ai} att={att} />)}
                    {msg.text}
                    {msg.editedAt && <span className="text-[10px] opacity-60"> (изм.)</span>}
                    <span className="bubble-time">{fmtTime(msg.createdAt)}{own && <CheckCheck size={13} />}</span>
                    {groupReactions(msg).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 pt-1.5 border-t"
                        style={{ borderColor: 'color-mix(in srgb, var(--color-text) 15%, transparent)' }}>
                        {groupReactions(msg).map(([e, users]) => {
                          const mine = users.some((u: any) => u?.id === user?.id);
                          return (
                            <button key={e} className="animate-reaction flex items-center gap-1.5 px-2 py-1 rounded-full active:scale-95 transition-transform"
                              style={{
                                background: own
                                  ? 'var(--color-surface)'
                                  : (mine
                                    ? 'color-mix(in srgb, var(--color-accent) 45%, transparent)'
                                    : 'color-mix(in srgb, var(--color-text) 14%, transparent)'),
                                border: mine ? '1.5px solid var(--color-accent)' : '1.5px solid transparent',
                              }}
                              onClick={ev => { ev.stopPropagation(); react(msg, e); }}>
                              <span className="text-sm">{e}</span>
                              <div className="flex -space-x-2">
                                {users.slice(0, 4).map((u: any, ui: number) => (
                                  <Avatar key={ui} name={u?.displayName || u?.username || '…'} imageUrl={u?.avatarUrl} size={20} />
                                ))}
                              </div>
                              {users.length > 1 && <span className="text-xs font-bold">{users.length}</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          {messages.length === 0 && (
            <div className="m-auto text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {isMotes ? 'Сохраняй мысли, ссылки и картинки — только ты это увидишь.' : 'Сообщений пока нет — напиши первым!'}
            </div>
          )}
        </div>

        {pending && (
          <div className="flex items-center gap-3 px-4 py-2 border-t"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-background-secondary)' }}>
            {uploading ? (
              <div className="relative overflow-hidden rounded-full flex items-center justify-center shrink-0"
                style={{ width: 44, height: 44, background: 'color-mix(in srgb, var(--color-text) 12%, transparent)' }}>
                <span className="absolute left-0 right-0 bottom-0"
                  style={{ height: `${Math.round(uploadProgress * 100)}%`, background: 'color-mix(in srgb, var(--color-accent) 85%, transparent)', transition: 'height .12s linear' }} />
                <span className="relative text-[10px] font-bold text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,.7)' }}>
                  {Math.round(uploadProgress * 100)}%
                </span>
              </div>
            ) : pending.type === 'image' ? <ImageIcon size={22} style={{ color: 'var(--color-accent)' }} />
              : pending.type === 'video' ? <Video size={22} style={{ color: 'var(--color-accent)' }} />
              : pending.type === 'voice' ? <Music size={22} style={{ color: 'var(--color-accent)' }} />
              : <FileText size={22} style={{ color: 'var(--color-accent)' }} />}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{pending.name}</div>
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {fmtSize(pending.size)}{uploading ? ` · ${Math.round(uploadProgress * 100)}%` : ''}
              </div>
            </div>
            <button type="button" className="icon-btn" onClick={() => setPending(null)}><X size={16} /></button>
          </div>
        )}

        {editing && (
          <div className="flex items-center gap-2 px-4 py-1.5 text-sm border-t"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-background-secondary)', color: 'var(--color-accent-hover)' }}>
            <Pencil size={14} /> Редактирование
            <button className="icon-btn ml-auto" onClick={() => { setEditing(null); setText(''); }}><X size={16} /></button>
          </div>
        )}

        <form onSubmit={send} className="flex items-end gap-2 px-3 py-3 border-t"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-background-secondary)' }}>
          <input ref={fileRef} type="file" hidden onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); e.target.value = ''; }} />
          <button type="button" className="icon-btn shrink-0" onClick={() => fileRef.current?.click()}><Paperclip size={20} /></button>
          <textarea ref={taRef} rows={1} className="nexus-input resize-none flex-1 max-h-[140px]" placeholder="Сообщение…"
            value={text} onChange={e => { onInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px'; }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
          <button type="submit" disabled={uploading || (!text.trim() && !pending)} className="btn-accent !rounded-full w-12 h-12 !p-0 shrink-0"><Send size={20} /></button>
        </form>
      </main>

      {menu && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/60 p-4" onClick={() => { setMenu(null); setPickerOpen(false); }}>
          {pickerOpen ? (
            <div className="w-[86%] max-w-[300px] rounded-2xl p-1.5 shadow-2xl" style={{ background: 'var(--color-surface)' }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-1.5 px-1 pb-1.5 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <Clock size={18} className="shrink-0 opacity-70" style={{ color: 'var(--color-text-muted)' }} />
                <div className="flex items-center gap-0.5 overflow-x-auto">
                  {recents.map(e => (
                    <button key={e} className="text-xl p-0.5 rounded-full active:scale-90 transition-transform shrink-0"
                      onClick={() => { pushRecent(e); react(menu, e); setMenu(null); setPickerOpen(false); }}>{e}</button>
                  ))}
                </div>
                <button className="ml-auto shrink-0 rounded-full p-1 active:scale-90"
                  style={{ background: 'color-mix(in srgb, var(--color-text) 12%, transparent)' }}
                  onClick={() => setPickerOpen(false)}><ChevronDown size={16} className="rotate-180" /></button>
              </div>
              <div className="grid grid-cols-8 gap-0 max-h-[34vh] overflow-y-auto pt-1">
                {EMOJIS.map((e, i) => (
                  <button key={i} className="text-xl p-0.5 rounded-full active:scale-90 transition-transform"
                    onClick={() => { pushRecent(e); react(menu, e); setMenu(null); setPickerOpen(false); }}>{e}</button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-0.5 rounded-full px-2 py-1.5 shadow-2xl" style={{ background: 'var(--color-surface)' }} onClick={e => e.stopPropagation()}>
              {(recents.length ? recents : EMOJIS.slice(0, 7)).map((e, i) => (
                <button key={i} className="text-2xl p-1 rounded-full active:scale-90 transition-transform"
                  onClick={() => { pushRecent(e); react(menu, e); setMenu(null); }}>{e}</button>
              ))}
              <button className="ml-1 shrink-0 rounded-full p-1.5 active:scale-90"
                style={{ background: 'color-mix(in srgb, var(--color-text) 12%, transparent)' }}
                onClick={() => setPickerOpen(true)}><ChevronDown size={18} /></button>
            </div>
          )}

          {/* Меню действий */}
          <div className="w-[86%] max-w-[300px] rounded-2xl overflow-hidden shadow-2xl" style={{ background: 'var(--color-surface)' }} onClick={e => e.stopPropagation()}>
            {menu.senderId === user?.id && (
              <button className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left active:opacity-70" onClick={() => setViewsOpen(o => !o)}>
                <Eye size={20} style={{ color: 'var(--color-text-muted)' }} />
                <span className="flex-1 font-semibold">{menuViews.length > 0 ? `${menuViews.length} ${pluralViews(menuViews.length)}` : 'Ещё никто не посмотрел'}</span>
                <div className="flex -space-x-2">
                  {menuViews.slice(0, 5).map((v: any) => (
                    <Avatar key={v.id} name={v.user?.displayName || v.user?.username || '…'} imageUrl={v.user?.avatarUrl} size={24} />
                  ))}
                </div>
              </button>
            )}
            {viewsOpen && menuViews.length > 0 && (
              <div className="px-4 pb-2 text-xs space-y-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {menuViews.slice(0, 8).map((v: any) => (
                  <div key={v.id}>{v.user?.displayName || v.user?.username} · {fmtTime(v.viewedAt)}</div>
                ))}
              </div>
            )}
            <button className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left active:opacity-70"
              onClick={() => { if (menu.text) navigator.clipboard?.writeText(menu.text); setMenu(null); }}>
              <Copy size={20} style={{ color: 'var(--color-text-muted)' }} />
              <span className="font-semibold">Копировать</span>
            </button>
            {menu.senderId === user?.id && (
              <>
                <button className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left active:opacity-70"
                  onClick={() => { setEditing(menu); setText(menu.text || ''); setMenu(null); taRef.current?.focus(); }}>
                  <Pencil size={20} style={{ color: 'var(--color-text-muted)' }} />
                  <span className="font-semibold">Изменить</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left active:opacity-70"
                  style={{ color: 'var(--color-error)' }} onClick={() => del(menu)}>
                  <Trash2 size={20} />
                  <span className="font-semibold">Удалить</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {gallery && <MotesGallery onClose={() => setGallery(false)} onPick={pickFromGallery} />}
    </div>
  );
}

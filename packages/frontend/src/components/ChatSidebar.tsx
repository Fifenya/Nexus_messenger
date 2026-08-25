import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Settings, Plus, Users, UserPlus, Pin, PinOff, GripVertical, ArrowUpDown, Check } from 'lucide-react';
import {
  DndContext, DragOverlay, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../utils/api';
import { useAuthStore } from '../store/auth.store';
import { getSocket } from '../lib/socket';
import { usePresenceStore } from '../store/presence.store';
import { Avatar, Logo, fmtListTime } from './ui';

function ChatRow({ c, activeId, onOpen, onMenu, editMode, peerOnline }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: c.id });
  const peer = c.type === 'PRIVATE'
    ? c.members?.map((m: any) => m.user).find((u: any) => u && u.id !== (window as any).__nexusUserId)
    : null;
  const title = c.title || peer?.displayName || peer?.username || 'Чат';
  const suppress = useRef(false);
  const isOnline = peerOnline ?? peer?.onlineStatus === 'online';
  const getMediaLabel = (att: any) => {
    if (!att) return '';
    const mime = att.mimeType || '';
    if (mime.startsWith('image/') || att.type === 'image') return '📷 Фото';
    if (mime.startsWith('video/') || att.type === 'video') return '🎬 Видео';
    if (mime.startsWith('audio/') || att.type === 'voice') return '🎤 Голосовое';
    if (mime.includes('gif')) return '🎭 GIF';
    return '📎 Файл';
  };

  const lastMsgText = (() => {
    const msg = c.lastMessage;
    if (!msg) return 'Нет сообщений';
    const atts = Array.isArray(msg.attachments) ? msg.attachments : msg.attachmentUrl ? [{ type: 'file', url: msg.attachmentUrl }] : [];
    if (atts.length > 0 && !msg.text) return getMediaLabel(atts[0]);
    if (atts.length > 0 && msg.text) return `${msg.text} ${getMediaLabel(atts[0])}`;
    return msg.text || '';
  })();

  const lastText = c.type === 'GROUP' && c.lastMessage
    ? `${c.lastMessage.senderId === (window as any).__nexusUserId ? 'Вы' : (c.lastMessage.sender?.displayName || c.lastMessage.sender?.username || '…')}: ${lastMsgText}`
    : lastMsgText || 'Нет сообщений';

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.35 : 1 }}
      className={`chat-row w-full flex items-center gap-3 px-3 py-2.5 text-left ${c.id === activeId ? 'active' : ''}`}
      onClick={() => { if (!suppress.current && !editMode) onOpen(c.id); }}
      onContextMenu={e => { if (editMode) return; e.preventDefault(); onMenu(c); }}
      onTouchStart={() => {
        if (editMode) return;
        const t = setTimeout(() => { suppress.current = true; onMenu(c); }, 450);
        (window as any).__menuTimer = t;
      }}
      onTouchEnd={() => { clearTimeout((window as any).__menuTimer); setTimeout(() => { suppress.current = false; }, 80); }}
      onTouchMove={() => clearTimeout((window as any).__menuTimer)}
    >
      <Avatar name={title} imageUrl={c.avatarUrl || (c.type === 'MOTES' ? '/notes.png' : peer?.avatarUrl)}
        online={isOnline} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          {c.pinned && <Pin size={12} className="shrink-0 self-center" style={{ color: 'var(--color-accent)' }} />}
          <span className="font-semibold truncate">{title}</span>
          <span className="ml-auto text-xs shrink-0" style={{ color: 'var(--color-text-muted)' }}>
            {fmtListTime(c.lastMessage?.createdAt || c.updatedAt)}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-sm truncate flex-1" style={{ color: 'var(--color-text-muted)' }}>
            {lastText}
          </span>
          {!!c.unreadCount && <span className="badge-unread">{c.unreadCount}</span>}
        </div>
      </div>
      {editMode && (
        <button
          className="icon-btn shrink-0 touch-none cursor-grab active:cursor-grabbing"
          style={{ color: 'var(--color-accent)' }}
          {...attributes}
          {...listeners}
          onClick={e => e.stopPropagation()}
        >
          <GripVertical size={20} />
        </button>
      )}
    </div>
  );
}

function ChatRowWithPresence({ c, ...rest }: any) {
  const peer = c.type === 'PRIVATE'
    ? c.members?.map((m: any) => m.user).find((u: any) => u && u.id !== (window as any).__nexusUserId)
    : null;
  const peerId = peer?.id;
  const online = usePresenceStore((s) => (peerId ? s.online.has(peerId) : false));
  return <ChatRow {...rest} c={c} peerOnline={online} />;
}

export default function ChatSidebar({ activeId }: { activeId?: string }) {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const [chats, setChats] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [menu, setMenu] = useState<any>(null);
  const [drag, setDrag] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [fab, setFab] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  (window as any).__nexusUserId = user?.id;

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
  );

  const fetchChats = () => api.get('/chats').then(r => setChats(r.data)).catch(console.error);
  useEffect(() => {
    fetchChats();
    const socket = getSocket();
    if (!socket) return;
    const onUpdated = (c: any) => {
      setChats(prev => {
        const idx = prev.findIndex(x => x.id === c.id);
        if (idx === -1) return [c, ...prev];
        const next = [...prev];
        next[idx] = { ...next[idx], ...c };
        return next;
      });
    };
    socket.on('chat:updated', onUpdated);
    return () => { socket.off('chat:updated', onUpdated); };
  }, []);

  useEffect(() => {
    if (!q.trim()) { setUsers([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await api.get(`/users/search?q=${q}`);
        setUsers(r.data.filter((u: any) => u.id !== user?.id));
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const peer = (c: any) => c.type === 'PRIVATE'
    ? c.members?.map((m: any) => m.user).find((u: any) => u && u.id !== user?.id)
    : null;
  const title = (c: any) => c.title || peer(c)?.displayName || peer(c)?.username || 'Чат';

  const startChat = async (memberId: string) => {
    try {
      const r = await api.post('/chats', { type: 'PRIVATE', memberIds: [memberId] });
      setQ('');
      if (r.data?.id) navigate(`/chat/${r.data.id}`);
      fetchChats();
    } catch (e) { console.error(e); }
  };

  const togglePin = (c: any) => {
    setMenu(null);
    const willPin = !c.pinned;
    setChats(prev => [{ ...c, pinned: willPin }, ...prev.filter(x => x.id !== c.id)]);
    api.post(`/chats/${c.id}/${willPin ? 'pin' : 'unpin'}`).catch(() => fetchChats());
  };

  const onDragStart = (e: DragStartEvent) => setDrag(chats.find(c => c.id === e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setDrag(null);
    if (!over || active.id === over.id) return;
    const pinnedIds = chats.filter(c => c.pinned).map(c => c.id);
    const normalIds = chats.filter(c => !c.pinned).map(c => c.id);
    const isPinned = pinnedIds.includes(active.id as string);
    const list = isPinned ? pinnedIds : normalIds;
    if (!list.includes(over.id as string)) return;
    const nextList = arrayMove(list, list.indexOf(active.id as string), list.indexOf(over.id as string));
    const newPinned = isPinned ? nextList : pinnedIds;
    const newNormal = isPinned ? normalIds : nextList;
    const byId: any = Object.fromEntries(chats.map(c => [c.id, c]));
    setChats([...newPinned.map(id => byId[id]), ...newNormal.map(id => byId[id])]);
    api.post('/chats/reorder', { pinned: newPinned, normal: newNormal }).catch(() => fetchChats());
  };

  const pinnedChats = chats.filter(c => c.pinned);
  const normalChats = chats.filter(c => !c.pinned);

  const renderRow = (c: any) => (
    <ChatRowWithPresence key={c.id} c={c} activeId={activeId} editMode={editMode}
      onOpen={(id: string) => navigate(`/chat/${id}`)}
      onMenu={(chat: any) => setMenu(chat)} />
  );

  return (
    <aside className="w-full lg:w-[380px] lg:border-r h-full flex flex-col relative"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-background-secondary)' }}>

      {editMode ? (
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <ArrowUpDown size={20} style={{ color: 'var(--color-accent)' }} />
          <span className="text-lg font-extrabold tracking-tight">Порядок чатов</span>
          <div className="flex-1" />
          <button className="btn-accent !rounded-full px-4 py-2 flex items-center gap-1" onClick={() => setEditMode(false)}>
            <Check size={18} /> Готово
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <Logo size={34} />
          <span className="text-lg font-extrabold tracking-tight">Nexus</span>
          <div className="flex-1" />
          <button className="icon-btn" onClick={() => navigate('/settings')} title="Настройки">
            <Settings size={20} />
          </button>
        </div>
      )}

      <div className="px-3 pb-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--color-text-muted)' }} />
          <input ref={searchRef} className="nexus-input pl-10" placeholder="Поиск людей и чатов"
            value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-28">
        {q.trim() && users.length > 0 && !editMode && (
          <>
            <div className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--color-text-muted)' }}>Глобальный поиск</div>
            {users.map(u => (
              <button key={u.id} className="chat-row w-full flex items-center gap-3 px-3 py-2.5 text-left"
                onClick={() => startChat(u.id)}>
                <Avatar name={u.displayName || u.username} imageUrl={u.avatarUrl} online={u.onlineStatus === 'online'} />
                <div className="min-w-0">
                  <div className="font-semibold truncate">{u.displayName || u.username}</div>
                  <div className="text-sm truncate" style={{ color: 'var(--color-text-muted)' }}>@{u.username}</div>
                </div>
              </button>
            ))}
            <div className="mx-3 my-2 border-t" style={{ borderColor: 'var(--color-border)' }} />
          </>
        )}

        {chats.length === 0 && !q && (
          <div className="flex flex-col items-center gap-3 pt-24 px-8 text-center"
            style={{ color: 'var(--color-text-muted)' }}>
            <Users size={40} strokeWidth={1.5} />
            <p className="text-sm">Чатов пока нет.<br />Найди собеседника через поиск и нажми на него.</p>
          </div>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter}
          onDragStart={onDragStart} onDragEnd={onDragEnd}>
          {pinnedChats.length > 0 && (
            <>
              <div className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide flex items-center gap-1"
                style={{ color: 'var(--color-text-muted)' }}>
                <Pin size={11} /> Закреплённые
              </div>
              <SortableContext items={pinnedChats.map(c => c.id)} strategy={verticalListSortingStrategy}>
                {pinnedChats.map(renderRow)}
              </SortableContext>
              <div className="mx-3 my-2 border-t" style={{ borderColor: 'var(--color-border)' }} />
            </>
          )}
          <SortableContext items={normalChats.map(c => c.id)} strategy={verticalListSortingStrategy}>
            {normalChats.map(renderRow)}
          </SortableContext>
          <DragOverlay>
            {drag && (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl drag-overlay-card"
                style={{ background: 'var(--color-surface)' }}>
                <Avatar name={title(drag)} imageUrl={drag.avatarUrl || (drag.type === 'MOTES' ? '/notes.png' : peer(drag)?.avatarUrl)} />
                <div className="font-semibold">{title(drag)}</div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      <button className="btn-accent absolute bottom-24 right-5 !rounded-full w-14 h-14 !p-0"
        onClick={() => setFab(true)} title="Новый чат">
        <Plus size={22} />
      </button>

      {menu && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setMenu(null)}>
          <div className="w-full max-w-md p-4 pb-6 space-y-2 rounded-t-2xl"
            style={{ background: 'var(--color-surface)' }} onClick={e => e.stopPropagation()}>
            <div className="text-center font-bold pb-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
              {title(menu)}
            </div>
            <button className="btn-accent w-full flex items-center justify-center gap-2" onClick={() => togglePin(menu)}>
              {menu.pinned ? <><PinOff size={18} /> Открепить</> : <><Pin size={18} /> Закрепить</>}
            </button>
            <button className="btn-accent w-full flex items-center justify-center gap-2"
              onClick={() => { setMenu(null); setEditMode(true); }}>
              <ArrowUpDown size={18} /> Изменить порядок
            </button>
          </div>
        </div>
      )}
      {fab && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setFab(false)}>
          <div className="w-full max-w-md p-4 pb-6 space-y-2 rounded-t-2xl"
            style={{ background: 'var(--color-surface)' }} onClick={e => e.stopPropagation()}>
            <button className="btn-accent w-full flex items-center justify-center gap-2"
              onClick={() => { setFab(false); navigate('/create'); }}>
              <Users size={18} /> Новая группа
            </button>
            <button className="btn-accent w-full flex items-center justify-center gap-2"
              onClick={() => { setFab(false); navigate('/contacts'); }}>
              <UserPlus size={18} /> Добавить контакт
            </button>
            <button className="btn-accent w-full flex items-center justify-center gap-2"
              onClick={() => { setFab(false); const el = searchRef.current; el?.scrollIntoView({ behavior: 'smooth' }); el?.focus(); el?.classList.add('ring-pulse'); setTimeout(() => el?.classList.remove('ring-pulse'), 900); }}>
              <Search size={18} /> Найти собеседника
            </button>
          </div>
        </div>
      )}

    </aside>
  );
}

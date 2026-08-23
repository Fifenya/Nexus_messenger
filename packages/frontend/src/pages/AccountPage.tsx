import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, AtSign, Cake, Sparkles, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { api } from '../utils/api';

const IconBox = ({ bg, children }: any) => (
  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white" style={{ background: bg }}>
    {children}
  </div>
);

export default function AccountPage() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const updateUser = useAuthStore(s => s.updateUser);
  const logout = useAuthStore(s => s.logout);
  const parts = (user?.displayName || '').split(' ');
  const [first, setFirst] = useState(parts[0] || '');
  const [last, setLast] = useState(parts.slice(1).join(' ') || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [bday, setBday] = useState(localStorage.getItem('nexus-bday') || '');
  const [showBday, setShowBday] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const displayName = `${first} ${last}`.trim() || user?.username;
      await api.patch('/users/me', { displayName, bio: bio.trim() });
      updateUser({ displayName, bio: bio.trim() });
      localStorage.setItem('nexus-bday', bday);
      alert('Сохранено');
    } catch (e: any) {
      alert('Ошибка: ' + (e?.response?.data?.message || e.message));
    }
    setSaving(false);
  };

  return (
    <div className="h-[100dvh] flex flex-col" style={{ background: 'var(--color-background)' }}>
      <header className="flex items-center gap-3 px-4 py-3 border-b sticky top-0 z-10"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-background)' }}>
        <button className="icon-btn" onClick={() => navigate('/settings')}><ArrowLeft size={22} /></button>
        <div className="font-semibold text-lg flex-1">Аккаунт</div>
        <button className="icon-btn" onClick={save} disabled={saving}
          style={{ color: 'var(--color-accent)' }}>
          <Check size={22} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl mx-auto w-full pb-24">
        <section className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--color-surface)' }}>
          <div className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>Ваше имя</div>
          <input value={first} onChange={e => setFirst(e.target.value)} placeholder="Имя" className="nexus-input w-full" />
          <input value={last} onChange={e => setLast(e.target.value)} placeholder="Фамилия" className="nexus-input w-full" />
        </section>

        <section className="rounded-2xl p-4" style={{ background: 'var(--color-surface)' }}>
          <div className="flex items-center gap-2">
            <input value={bio} maxLength={70} onChange={e => setBio(e.target.value)} placeholder="«О себе»" className="nexus-input flex-1" />
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{70 - bio.length}</span>
          </div>
        </section>
        <p className="text-sm px-1" style={{ color: 'var(--color-text-muted)' }}>Напишите немного о себе.</p>

        <section className="rounded-2xl p-4 space-y-4" style={{ background: 'var(--color-surface)' }}>
          <div className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>Информация о Вас</div>
          <div className="flex items-center gap-3">
            <IconBox bg="#f59f00"><AtSign size={20} /></IconBox>
            <div>
              <div className="font-medium">@{user?.username}</div>
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Имя пользователя — его видят все</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <IconBox bg="#2196f3"><Cake size={20} /></IconBox>
            <div className="flex-1">
              {showBday ? (
                <input type="date" value={bday} onChange={e => setBday(e.target.value)} className="nexus-input w-full" />
              ) : (
                <button onClick={() => setShowBday(true)} className="font-medium text-left">
                  {bday ? new Date(bday).toLocaleDateString('ru-RU') : 'Указать день рождения'}
                </button>
              )}
            </div>
          </div>
        </section>
        <p className="text-sm px-1" style={{ color: 'var(--color-text-muted)' }}>День рождения хранится локально, виден только вам.</p>

        <section className="rounded-2xl p-4" style={{ background: 'var(--color-surface)' }}>
          <button className="flex items-center gap-3 w-full text-left" onClick={() => navigate('/bots')}>
            <IconBox bg="#9c27b0"><Sparkles size={20} /></IconBox>
            <div className="flex-1 font-medium">Автоматизация чатов</div>
            <span className="text-xs font-bold text-white px-2 py-0.5 rounded-md" style={{ background: 'var(--color-accent)' }}>NEW</span>
          </button>
        </section>
        <p className="text-sm px-1" style={{ color: 'var(--color-text-muted)' }}>Подключите бота, который будет отвечать на сообщения от Вашего имени.</p>

        <section className="rounded-2xl p-2" style={{ background: 'var(--color-surface)' }}>
          <button className="flex items-center gap-3 w-full p-3 text-left" style={{ color: '#f44336' }}
            onClick={() => { logout(); navigate('/login'); }}>
            <LogOut size={20} />
            <span className="font-medium">Выход</span>
          </button>
        </section>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Database, LogOut, Palette, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { useThemeStore, NEXUS_DARK_THEME, NEXUS_CYBERPUNK_THEME } from '../store/themeStore';
import { api } from '../utils/api';
import BottomNav from '../components/BottomNav';

function Row({ color, icon: Icon, title, sub, onClick }: any) {
  return (
    <button className="w-full flex items-center gap-4 p-3 text-left active:opacity-70" onClick={onClick} disabled={!onClick}>
      <span className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: color }}>
        <Icon size={20} />
      </span>
      <span className="min-w-0">
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm truncate" style={{ color: 'var(--color-text-muted)' }}>{sub}</span>
      </span>
    </button>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const updateUser = useAuthStore(s => s.updateUser);
  const { currentTheme, setTheme, resetTheme } = useThemeStore();
  const [open, setOpen] = useState<string | null>(null);
  const [name, setName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saved, setSaved] = useState(false);

  const save = async () => {
    try {
      const r = await api.patch('/users/me', { displayName: name.trim(), bio: bio.trim() });
      updateUser({ displayName: r.data?.displayName || name.trim(), bio: r.data?.bio ?? bio.trim() });
      setSaved(true); setTimeout(() => setSaved(false), 1500);
    } catch (e) { console.error(e); }
  };

  const card: React.CSSProperties = { background: 'var(--color-surface)', borderColor: 'var(--color-border)' };

  return (
    <div className="h-[100dvh] overflow-y-auto chat-wallpaper pb-24">
      <header className="px-4 pt-4 pb-2 sticky top-0 z-10" style={{ background: 'var(--color-background)' }}>
        <div className="text-xl font-extrabold">Настройки</div>
      </header>

      <div className="max-w-2xl mx-auto p-3 space-y-3">
        <section className="rounded-2xl border overflow-hidden" style={card}>
          <Row color="#3390ec" icon={UserIcon} title="Аккаунт" sub={`@${user?.username} · имя и «о себе»`}
            onClick={() => setOpen(o => o === 'acc' ? null : 'acc')} />
          {open === 'acc' && (
            <div className="px-3 pb-3 space-y-2">
              <input className="nexus-input" value={name} onChange={e => setName(e.target.value)} placeholder="Отображаемое имя" />
              <textarea className="nexus-input resize-none" rows={2} value={bio} onChange={e => setBio(e.target.value)} placeholder="О себе" />
              <button className="btn-accent w-full" onClick={save}>{saved ? <Check size={18} /> : 'Сохранить'}</button>
            </div>
          )}
          <Row color="#e0a03c" icon={Palette} title="Оформление" sub="Темы: Nexus Dark / Cyberpunk"
            onClick={() => setOpen(o => o === 'theme' ? null : 'theme')} />
          {open === 'theme' && (
            <div className="px-3 pb-3 flex flex-wrap gap-2">
              <button className="btn-accent" style={currentTheme.name === NEXUS_DARK_THEME.name ? {} : { filter: 'grayscale(70%)', opacity: .6 }} onClick={() => setTheme(NEXUS_DARK_THEME)}>Nexus Dark</button>
              <button className="btn-accent" style={currentTheme.name === NEXUS_CYBERPUNK_THEME.name ? {} : { filter: 'grayscale(70%)', opacity: .6 }} onClick={() => setTheme(NEXUS_CYBERPUNK_THEME)}>Cyberpunk</button>
              <button className="icon-btn" onClick={resetTheme}><Palette size={18} /></button>
            </div>
          )}
        </section>

        <section className="rounded-2xl border overflow-hidden" style={card}>
          <Row color="#e05050" icon={Bell} title="Уведомления" sub="Скоро" />
          <Row color="#8774e1" icon={Database} title="Данные и память" sub="Скоро" />
        </section>

        <section className="rounded-2xl border overflow-hidden" style={card}>
          <button className="w-full flex items-center gap-4 p-3 text-left"
            style={{ color: 'var(--color-error)' }}
            onClick={() => { logout(); navigate('/login'); }}>
            <LogOut size={20} /> <span className="font-semibold">Выйти из аккаунта</span>
          </button>
        </section>
      </div>
      <BottomNav />
    </div>
  );
}

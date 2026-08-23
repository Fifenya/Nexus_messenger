import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AtSign, Lock, User } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { Logo } from '../components/ui';
import { api } from '../utils/api';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.post('/auth/register', {
        username: username.trim(),
        displayName: displayName.trim() || username.trim(),
        password,
      });
      try {
        await useAuthStore.getState().login(username.trim(), password);
        navigate('/');
      } catch { navigate('/login'); }
    } catch (err: any) {
      const data = err?.response?.data;
      let msg = 'Не удалось зарегистрироваться. Проверь данные.';
      if (data?.message) msg = Array.isArray(data.message) ? data.message.join('. ') : String(data.message);
      else if (data?.error) msg = String(data.error);
      setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="h-[100dvh] chat-wallpaper flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center gap-3 mb-6">
          <Logo size={64} />
          <div className="text-2xl font-extrabold tracking-tight">Nexus</div>
          <p className="text-sm -mt-2" style={{ color: 'var(--color-text-muted)' }}>Создать аккаунт</p>
        </div>
        <form onSubmit={handleSubmit} className="rounded-2xl p-6 space-y-4 border"
          style={{ background: 'color-mix(in srgb, var(--color-surface) 80%, transparent)', backdropFilter: 'blur(20px)', borderColor: 'var(--color-border)' }}>
          {error && <div className="text-sm text-center font-medium" style={{ color: 'var(--color-error)' }}>{error}</div>}
          <div className="relative">
            <AtSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
            <input className="nexus-input" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          <div className="relative">
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
            <input className="nexus-input" placeholder="Отображаемое имя" value={displayName} onChange={e => setDisplayName(e.target.value)} />
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
            <input className="nexus-input" type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button className="btn-accent w-full" disabled={loading}>{loading ? 'Создаём…' : 'Создать аккаунт'}</button>
          <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
            Username: строчные латинские буквы, цифры, «_».<br />Пароль: минимум 6 символов.
          </p>
          <p className="text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Уже есть аккаунт?{' '}
            <Link to="/login" className="font-semibold" style={{ color: 'var(--color-accent-hover)' }}>Войти</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

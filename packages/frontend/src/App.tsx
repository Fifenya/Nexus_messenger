import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import { useChatSettings } from './store/chatSettings.store';
import { connectSocket, disconnectSocket } from './lib/socket';
import { usePresenceStore } from './store/presence.store';
import { Logo } from './components/ui';

useChatSettings.getState().apply();

const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const ChatListPage = React.lazy(() => import('./pages/ChatListPage'));
const ChatPage = React.lazy(() => import('./pages/ChatPage'));
const CreateChatPage = React.lazy(() => import("./pages/CreateChatPage"));
const StylePage = React.lazy(() => import("./pages/StylePage"));
const AccountPage = React.lazy(() => import("./pages/AccountPage"));
const ChatSettingsPage = React.lazy(() => import("./pages/ChatSettingsPage"));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const ContactsPage = React.lazy(() => import('./pages/ContactsPage'));
const MePage = React.lazy(() => import('./pages/MePage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const ThemesPage = React.lazy(() => import('./pages/ThemesPage'));
const PrivacyPage = React.lazy(() => import('./pages/PrivacyPage'));
const NotificationsPage = React.lazy(() => import('./pages/NotificationsPage'));
const StoragePage = React.lazy(() => import('./pages/StoragePage'));
const BotsPage = React.lazy(() => import('./pages/BotsPage'));
const SupportPage = React.lazy(() => import('./pages/SupportPage'));
const StatsPage = React.lazy(() => import('./pages/StatsPage'));
const GroupProfilePage = React.lazy(() => import('./pages/GroupProfilePage'));

function Splash() {
  return (
    <div className="h-[100dvh] chat-wallpaper flex items-center justify-center">
      <div className="animate-pulse"><Logo size={64} /></div>
    </div>
  );
}

function ErrorScreen({ error }: { error: Error }) {
  return (
    <div className="h-[100dvh] chat-wallpaper flex flex-col items-center justify-center gap-4 p-6 text-center">
      <Logo size={56} />
      <div className="text-xl font-extrabold" style={{ color: 'var(--color-error)' }}>Что-то сломалось</div>
      <pre className="text-xs max-w-xl overflow-auto p-3 rounded-lg whitespace-pre-wrap"
        style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface)' }}>{error.message}</pre>
      <button className="btn-accent" onClick={() => location.reload()}>Перезагрузить</button>
    </div>
  );
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error?: Error }> {
  state = { error: undefined as Error | undefined };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(err: Error, info: any) { console.error('[ErrorBoundary]', err, info); }
  render() {
    if (this.state.error) return <ErrorScreen error={this.state.error} />;
    return this.props.children;
  }
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  const { initialize, isLoading, user, token, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[App] mounted, calling initialize');
    initialize();
  }, []);

  useEffect(() => {
    console.log('[App] isLoading:', isLoading, 'user:', !!user, 'token:', !!token);
  }, [isLoading, user, token]);

  useEffect(() => {
    if (isLoading) return;
    if (!user || !token) {
      console.log('[App] no session, go to login');
      navigate('/login', { replace: true });
    }
  }, [isLoading, user, token, navigate]);

  useEffect(() => {
    if (!token || !user) return;
    const socket = connectSocket(token);
    const unsub = usePresenceStore.getState().subscribe();
    return () => { unsub(); disconnectSocket(); };
  }, [token, user]);

  if (isLoading) return <Splash />;

  return (
    <React.Suspense fallback={<Splash />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<PrivateRoute><ChatListPage /></PrivateRoute>} />
        <Route path="/create" element={<PrivateRoute><CreateChatPage /></PrivateRoute>} />
        <Route path="/style" element={<PrivateRoute><StylePage /></PrivateRoute>} />
        <Route path="/account" element={<PrivateRoute><AccountPage /></PrivateRoute>} />
        <Route path="/chat-settings" element={<PrivateRoute><ChatSettingsPage /></PrivateRoute>} />
        <Route path="/chat/:id" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
        <Route path="/group-profile/:id" element={<PrivateRoute><GroupProfilePage /></PrivateRoute>} />
        <Route path="/user/:id" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/contacts" element={<PrivateRoute><ContactsPage /></PrivateRoute>} />
        <Route path="/me" element={<PrivateRoute><MePage /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
        <Route path="/themes" element={<PrivateRoute><ThemesPage /></PrivateRoute>} />
        <Route path="/privacy" element={<PrivateRoute><PrivacyPage /></PrivateRoute>} />
        <Route path="/bots" element={<PrivateRoute><BotsPage /></PrivateRoute>} />
          <Route path="/support" element={<PrivateRoute><SupportPage /></PrivateRoute>} />
          <Route path="/stats" element={<PrivateRoute><StatsPage /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
        <Route path="/storage" element={<PrivateRoute><StoragePage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </React.Suspense>
  );
}

function Root() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default Root;

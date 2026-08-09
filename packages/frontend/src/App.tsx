import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import { Logo } from './components/ui';

const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const ChatListPage = React.lazy(() => import('./pages/ChatListPage'));
const ChatPage = React.lazy(() => import('./pages/ChatPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const ContactsPage = React.lazy(() => import('./pages/ContactsPage'));
const MePage = React.lazy(() => import('./pages/MePage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error?: Error }> {
  state = { error: undefined as Error | undefined };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="h-[100dvh] chat-wallpaper flex flex-col items-center justify-center gap-4 p-6 text-center">
          <Logo size={56} />
          <div className="text-xl font-extrabold" style={{ color: 'var(--color-error)' }}>В интерфейсе что-то сломалось</div>
          <pre className="text-xs max-w-xl overflow-auto p-3 rounded-lg"
            style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface)' }}>{this.state.error.message}</pre>
          <button className="btn-accent" onClick={() => location.reload()}>Перезагрузить</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function Splash() {
  return (
    <div className="h-[100dvh] chat-wallpaper flex items-center justify-center">
      <div className="animate-pulse"><Logo size={64} /></div>
    </div>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  const { initialize, isLoading } = useAuthStore();
  React.useEffect(() => { initialize(); }, []);
  if (isLoading) return <Splash />;

  return (
    <ErrorBoundary>
      <React.Suspense fallback={<Splash />}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<PrivateRoute><ChatListPage /></PrivateRoute>} />
            <Route path="/chat/:id" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
            <Route path="/user/:id" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="/contacts" element={<PrivateRoute><ContactsPage /></PrivateRoute>} />
            <Route path="/me" element={<PrivateRoute><MePage /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </React.Suspense>
    </ErrorBoundary>
  );
}

export default App;

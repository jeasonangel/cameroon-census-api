// frontend/src/App.tsx
import { Link, Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { clearSession, getUser } from './lib/api';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Upgrade from './pages/Upgrade';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Keys from './pages/Keys';
import Explorer from './pages/Explorer';
import Docs from './pages/Docs';
import Playground from './pages/Playground';
import AdminImport from './pages/AdminImport';
import AdminUsers from './pages/AdminUsers';
import AdminApiKeys from './pages/AdminApiKeys';
import AdminLogs from './pages/AdminLogs';
import AdminSettings from './pages/AdminSettings';

function PublicNav() {
  return (
    <header className="border-b border-cm-line bg-cm-ink/80 backdrop-blur sticky top-0 z-40">
      <div className="flag-bar h-1" />
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="inline-block w-2 h-6 bg-cm-green rounded-sm" />
          <span className="inline-block w-2 h-6 bg-cm-red rounded-sm" />
          <span className="inline-block w-2 h-6 bg-cm-yellow rounded-sm" />
          <span className="ml-2">Cameroon Census API</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link to="/explorer" className="hover:text-cm-yellow">Explorer</Link>
          <Link to="/docs" className="hover:text-cm-yellow">Docs</Link>
          <Link to="/login" className="hover:text-cm-yellow">Sign in</Link>
          <Link to="/register" className="btn-primary">Get API Key</Link>
        </nav>
      </div>
    </header>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const user = getUser();
  const nav = useNavigate();
  
  // ✅ Redirect to login if no user
  if (!user) return <Navigate to="/login" replace />;
  
  const isAdmin = user.user_type === 'ADMIN';

  // ✅ If admin visits user dashboard, redirect to admin dashboard
  if (isAdmin && window.location.pathname === '/dashboard') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const link = (to: string, label: string) => (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `block px-3 py-2 rounded-md text-sm ${
          isActive ? 'bg-cm-green text-white' : 'text-white/70 hover:bg-cm-panel hover:text-white'
        }`
      }
    >
      {label}
    </NavLink>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flag-bar h-1" />
      <header className="border-b border-cm-line">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to={isAdmin ? "/admin/dashboard" : "/dashboard"} className="font-bold">
            {isAdmin ? 'Admin Portal' : 'Census Portal'}
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-cm-muted">{user.email}</span>
            <span className={`px-2 py-0.5 rounded text-xs ${isAdmin ? 'bg-cm-red' : 'bg-cm-green'} text-white`}>
              {user.user_type}
            </span>
            <button
              onClick={() => { clearSession(); nav('/login'); }}
              className="text-cm-muted hover:text-white"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        <aside className="w-56 border-r border-cm-line p-4 space-y-1">
          {isAdmin ? (
            // ─── ADMIN MENU ───
            <>
              {link('/admin/dashboard', '📊 Overview')}
              {link('/admin/users', '👥 Users')}
              {link('/admin/api-keys', '🔑 API Keys')}
              {link('/admin/import', '📥 Import CSV')}
              {link('/admin/logs', '📋 System Logs')}
              {link('/admin/settings', '⚙️ Settings')}
              <hr className="border-cm-line my-2" />
              {link('/explorer', '📊 Data Explorer')}
              {link('/docs', '📖 Documentation')}
            </>
          ) : (
            // ─── USER MENU ───
            <>
              {link('/dashboard', 'Overview')}
              {link('/keys', 'API Keys')}
              {link('/explorer', 'Data Explorer')}
              {link('/playground', 'API Playground')}
              {link('/docs', 'Documentation')}
            </>
          )}
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<><PublicNav /><Landing /></>} />
      <Route path="/login" element={<><PublicNav /><Login /></>} />
      <Route path="/register" element={<><PublicNav /><Register /></>} />
      <Route path="/upgrade" element={<><PublicNav /><Upgrade /></>} />

      {/* User Routes */}
      <Route path="/dashboard" element={<AppShell><Dashboard /></AppShell>} />
      <Route path="/keys" element={<AppShell><Keys /></AppShell>} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<AppShell><AdminDashboard /></AppShell>} />
      <Route path="/admin/import" element={<AppShell><AdminImport /></AppShell>} />
      <Route path="/admin/users" element={<AppShell><AdminUsers /></AppShell>} />
      <Route path="/admin/api-keys" element={<AppShell><AdminApiKeys /></AppShell>} />
      <Route path="/admin/logs" element={<AppShell><AdminLogs /></AppShell>} />
      <Route path="/admin/settings" element={<AppShell><AdminSettings /></AppShell>} />

      {/* Shared Routes */}
      <Route path="/explorer" element={<AppShell><Explorer /></AppShell>} />
      <Route path="/playground" element={<AppShell><Playground /></AppShell>} />
      <Route path="/docs" element={<AppShell><Docs /></AppShell>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
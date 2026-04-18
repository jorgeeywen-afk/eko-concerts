import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Music2, LayoutDashboard, Users, LogOut, Menu, X } from 'lucide-react';

function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
          isActive
            ? 'bg-indigo-600/20 text-indigo-400 font-medium'
            : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
        }`
      }
    >
      <Icon size={16} />
      {label}
    </NavLink>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="flex min-h-screen">

      {/* ── SIDEBAR desktop ── */}
      <aside className="hidden md:flex w-60 bg-zinc-900 border-r border-zinc-800 flex-col fixed h-screen z-30">
        <div className="px-5 py-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Music2 size={16} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-zinc-100 text-sm leading-none">EKO Agency</p>
              <p className="text-zinc-500 text-xs mt-0.5">Gestión de giras</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          {user?.role === 'admin' && (
            <NavItem to="/miembros" icon={Users} label="Miembros" />
          )}
        </nav>

        <div className="px-3 py-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 bg-indigo-600/20 rounded-full flex items-center justify-center text-indigo-400 font-semibold text-sm">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-100 truncate">{user?.name}</p>
              <p className="text-xs text-zinc-500">{user?.role === 'admin' ? 'Administrador' : 'Miembro'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors w-full"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── TOPBAR móvil ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Music2 size={14} className="text-white" />
          </div>
          <span className="font-semibold text-zinc-100 text-sm">EKO Agency</span>
        </div>
        <button
          onClick={() => setMenuOpen(v => !v)}
          className="p-2 text-zinc-400 hover:text-zinc-100"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* ── MENÚ móvil desplegable ── */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/50" onClick={closeMenu}>
          <div
            className="absolute top-14 left-0 right-0 bg-zinc-900 border-b border-zinc-800 p-4 space-y-1"
            onClick={e => e.stopPropagation()}
          >
            <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" onClick={closeMenu} />
            {user?.role === 'admin' && (
              <NavItem to="/miembros" icon={Users} label="Miembros" onClick={closeMenu} />
            )}
            <div className="pt-3 border-t border-zinc-800 mt-3">
              <div className="flex items-center gap-3 px-3 py-2 mb-1">
                <div className="w-8 h-8 bg-indigo-600/20 rounded-full flex items-center justify-center text-indigo-400 font-semibold text-sm">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-100">{user?.name}</p>
                  <p className="text-xs text-zinc-500">{user?.role === 'admin' ? 'Administrador' : 'Miembro'}</p>
                </div>
              </div>
              <button
                onClick={() => { handleLogout(); closeMenu(); }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors w-full"
              >
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTENIDO ── */}
      <main className="flex-1 md:ml-60 min-h-screen pt-14 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
}

import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Music2, LayoutDashboard, Users, LogOut } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 bg-zinc-900 border-r border-zinc-800 flex flex-col fixed h-screen">
        {/* Logo */}
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

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-400 font-medium'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
              }`
            }
          >
            <LayoutDashboard size={16} />
            Dashboard
          </NavLink>

          {user?.role === 'admin' && (
            <NavLink
              to="/miembros"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400 font-medium'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                }`
              }
            >
              <Users size={16} />
              Miembros
            </NavLink>
          )}
        </nav>

        {/* User info + logout */}
        <div className="px-3 py-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 bg-indigo-600/20 rounded-full flex items-center justify-center text-indigo-400 font-semibold text-sm">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-100 truncate">{user?.name}</p>
              <p className="text-xs text-zinc-500 capitalize">{user?.role === 'admin' ? 'Administrador' : 'Miembro'}</p>
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

      {/* Main content */}
      <main className="flex-1 ml-60 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}

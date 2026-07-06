import { useAuth } from '../context/AuthContext';
import { Clock, LayoutDashboard, LogOut, Settings, Calendar } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

export default function MainLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // If on login, do not wrap with headers or footers
  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white flex flex-col font-sans">
      {/* Header Navigation Panel */}
      <header className="sticky top-0 z-50 bg-[#111111]/90 backdrop-blur-md border-b border-[#FF7A00]/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-black border border-[#FF7A00]/20 flex items-center justify-center shadow-lg shadow-[#FF7A00]/5">
              <Clock size={20} className="animate-pulse text-[#FF7A00]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Vergil<span className="text-[#FF7A00]">Tempo</span>
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-2">
            {user.role.toLowerCase() === 'admin' ? (
              <>
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition ${
                      isActive ? 'bg-[#FF7A00] text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <LayoutDashboard size={16} />
                  <span>Overview</span>
                </NavLink>
                <NavLink
                  to="/admin/settings"
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition ${
                      isActive ? 'bg-[#FF7A00] text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </NavLink>
                <NavLink
                  to="/admin/leaves"
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition ${
                      isActive ? 'bg-[#FF7A00] text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <Calendar size={16} />
                  <span>Leaves</span>
                </NavLink>
              </>
            ) : (
              <NavLink
                to="/employee"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition ${
                    isActive ? 'bg-[#FF7A00] text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Clock size={16} />
                <span>Clock Portal</span>
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-white">{user.name}</div>
              <div className="text-[10px] text-[#FF7A00] font-bold uppercase tracking-wider">{user.role}</div>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 border border-white/10 hover:border-[#FF7A00] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition text-gray-300 hover:text-white hover:bg-[#FF7A00]/10"
              aria-label="Log Out"
            >
              <LogOut size={13} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-8 pb-24 md:pb-8 flex flex-col">
        {children}
      </main>

      {/* Footer copyright */}
      <footer className="border-t border-white/5 py-4 bg-[#111111]">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-xs text-gray-500">
          <p>&copy; 2026 Vergil Tempo. Engineered for performance.</p>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar (Visible only on mobile devices, admin only) */}
      {user.role.toLowerCase() === 'admin' && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#111111]/90 backdrop-blur-lg border-t border-[#FF7A00]/20 py-2.5 px-6 flex items-center justify-around z-50">
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex flex-col items-center text-[10px] font-medium transition ${
                isActive ? 'text-[#FF7A00]' : 'text-gray-400'
              }`
            }
          >
            <LayoutDashboard size={18} />
            <span className="mt-1">Overview</span>
          </NavLink>
          <NavLink
            to="/admin/settings"
            className={({ isActive }) =>
              `flex flex-col items-center text-[10px] font-medium transition ${
                isActive ? 'text-[#FF7A00]' : 'text-gray-400'
              }`
            }
          >
            <Settings size={18} />
            <span className="mt-1">Settings</span>
          </NavLink>
          <NavLink
            to="/admin/leaves"
            className={({ isActive }) =>
              `flex flex-col items-center text-[10px] font-medium transition ${
                isActive ? 'text-[#FF7A00]' : 'text-gray-400'
              }`
            }
          >
            <Calendar size={18} />
            <span className="mt-1">Leaves</span>
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex flex-col items-center text-[10px] text-gray-400 font-medium"
          >
            <LogOut size={18} />
            <span className="mt-1">Logout</span>
          </button>
        </nav>
      )}
    </div>
  );
}

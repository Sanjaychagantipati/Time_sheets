import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Clock, LayoutDashboard, LogOut, Settings, Calendar, 
  Briefcase, Users, Radio, CalendarPlus, History, 
  FileText, Menu, X, ChevronRight, Plus
} from 'lucide-react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Define navigation categories and links
  const navCategories = [
    {
      title: 'Dashboard',
      items: [
        { label: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'People',
      items: [
        { label: 'Client Companies', path: '/admin/clients', icon: Briefcase },
        { label: 'Candidates', path: '/admin/candidates', icon: Users }
      ]
    },
    {
      title: 'Attendance',
      items: [
        { label: 'Live Attendance', path: '/admin/attendance', icon: Radio },
        { label: 'Manual Entry', path: '/admin/manual-entry', icon: CalendarPlus }
      ]
    },
    {
      title: 'Leave Management',
      items: [
        { label: 'Leave Center', path: '/admin/leaves', icon: Calendar }
      ]
    },
    {
      title: 'Reports',
      items: [
        { label: 'Reports Audit', path: '/admin/reports', icon: FileText }
      ]
    },
    {
      title: 'Settings',
      items: [
        { label: 'Company Settings', path: '/admin/settings', icon: Settings }
      ]
    }
  ];

  // Breadcrumbs calculation
  const getBreadcrumbs = (pathname) => {
    switch (pathname) {
      case '/admin':
      case '/admin/dashboard':
        return ['Admin', 'Dashboard', 'Overview'];
      case '/admin/clients':
        return ['Admin', 'People', 'Client Companies'];
      case '/admin/candidates':
        return ['Admin', 'People', 'Candidates'];
      case '/admin/attendance':
        return ['Admin', 'Attendance', 'Logs & Live Status'];
      case '/admin/manual-entry':
        return ['Admin', 'Attendance', 'Manual Entry'];
      case '/admin/leave':
      case '/admin/leaves':
        return ['Admin', 'Leave Management', 'Leave Center'];
      case '/admin/reports':
        return ['Admin', 'Reports', 'Audits & Exports'];
      case '/admin/settings':
        return ['Admin', 'Settings', 'Company Settings'];
      default:
        return ['Admin'];
    }
  };

  const breadcrumbs = getBreadcrumbs(location.pathname);

  // Quick Action Handler
  const handleQuickAction = (path) => {
    setIsQuickActionOpen(false);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white flex font-sans">
      
      {/* 1. Left Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-[#2A2A2A] bg-[#111111] shrink-0 sticky top-0 h-screen z-40">
        {/* Brand Logo */}
        <div className="h-16 px-6 border-b border-[#2A2A2A] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-black border border-[#FF7A00]/20 flex items-center justify-center shadow-lg shadow-[#FF7A00]/5">
            <Clock size={16} className="text-[#FF7A00]" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Vergil<span className="text-[#FF7A00]">Tempo</span>
          </span>
        </div>

        {/* Navigation Categories */}
        <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 scrollbar-thin scrollbar-thumb-white/5">
          {navCategories.map((category, index) => (
            <div key={index} className="flex flex-col gap-1.5">
              <span className="px-3 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                {category.title}
              </span>
              <div className="flex flex-col gap-0.5">
                {category.items.map((item, idx) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <NavLink
                      key={idx}
                      to={item.path}
                      className={`px-3 py-2 rounded-xl flex items-center gap-2.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-[#FF7A00] text-white shadow-lg shadow-[#FF7A00]/15'
                          : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                      }`}
                    >
                      <Icon size={14} className={isActive ? 'text-white' : 'text-gray-400'} />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer User Details */}
        <div className="p-4 border-t border-[#2A2A2A] bg-black/10 flex flex-col gap-3">
          <div className="flex items-center gap-3 px-1.5">
            <div className="w-8 h-8 rounded-full bg-[#FF7A00]/10 border border-[#FF7A00]/30 text-[#FF7A00] font-black text-xs uppercase flex items-center justify-center shrink-0">
              {user?.name ? user.name.charAt(0) : 'A'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white truncate leading-tight">{user?.name}</span>
              <span className="text-[9px] text-[#FF7A00] font-bold uppercase tracking-wider mt-0.5">{user?.role}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 bg-white/5 hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/30 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition text-gray-400 hover:text-rose-400 cursor-pointer"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. Left Sidebar - Tablet (Icon layout) */}
      <aside className="hidden md:flex lg:hidden flex-col w-20 border-r border-[#2A2A2A] bg-[#111111] shrink-0 sticky top-0 h-screen z-40">
        <div className="h-16 flex items-center justify-center border-b border-[#2A2A2A]">
          <div className="w-8 h-8 rounded-lg bg-black border border-[#FF7A00]/20 flex items-center justify-center">
            <Clock size={16} className="text-[#FF7A00]" />
          </div>
        </div>
        <nav className="flex-grow p-3 flex flex-col items-center gap-6 pt-6 overflow-y-auto">
          {navCategories.map((category) =>
            category.items.map((item, idx) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={idx}
                  to={item.path}
                  title={item.label}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#FF7A00] text-white shadow-lg shadow-[#FF7A00]/15'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <Icon size={16} />
                </NavLink>
              );
            })
          )}
        </nav>
        <div className="p-3 border-t border-[#2A2A2A] flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-[#FF7A00]/10 border border-[#FF7A00]/30 text-[#FF7A00] font-black text-xs flex items-center justify-center">
            {user?.name ? user.name.charAt(0) : 'A'}
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="w-11 h-11 bg-white/5 hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/30 rounded-xl flex items-center justify-center text-gray-400 hover:text-rose-400 transition cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* 3. Mobile Navigation Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative flex flex-col w-72 max-w-[80vw] bg-[#111111] border-r border-[#2A2A2A] text-white py-4 z-10 animate-slide-right h-full">
            <div className="px-6 pb-4 border-b border-[#2A2A2A] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-black border border-[#FF7A00]/20 flex items-center justify-center">
                  <Clock size={16} className="text-[#FF7A00]" />
                </div>
                <span className="text-md font-bold tracking-tight text-white">
                  Vergil<span className="text-[#FF7A00]">Tempo</span>
                </span>
              </div>
              <button 
                onClick={() => setIsMobileOpen(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg transition"
              >
                <X size={16} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
              {navCategories.map((category, index) => (
                <div key={index} className="flex flex-col gap-1">
                  <span className="px-3 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                    {category.title}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    {category.items.map((item, idx) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                        <NavLink
                          key={idx}
                          to={item.path}
                          onClick={() => setIsMobileOpen(false)}
                          className={`px-3 py-2 rounded-xl flex items-center gap-2.5 text-xs font-bold transition cursor-pointer ${
                            isActive
                              ? 'bg-[#FF7A00] text-white shadow-lg shadow-[#FF7A00]/15'
                              : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                          }`}
                        >
                          <Icon size={14} />
                          <span>{item.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="p-4 border-t border-[#2A2A2A] bg-black/10 flex flex-col gap-3">
              <div className="flex items-center gap-3 px-1.5">
                <div className="w-8 h-8 rounded-full bg-[#FF7A00]/10 border border-[#FF7A00]/30 text-[#FF7A00] font-black text-xs uppercase flex items-center justify-center">
                  {user?.name ? user.name.charAt(0) : 'A'}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white leading-tight">{user?.name}</span>
                  <span className="text-[9px] text-[#FF7A00] font-bold uppercase tracking-wider mt-0.5">{user?.role}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full py-2.5 bg-white/5 hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/30 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition text-gray-400 hover:text-rose-400 cursor-pointer"
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Main Body Content (Header + Canvas) */}
      <div className="flex-grow flex flex-col min-w-0 min-h-screen relative">
        
        {/* Sticky Top Header */}
        <header className="sticky top-0 z-30 h-16 border-b border-[#2A2A2A] bg-[#111111]/90 backdrop-blur-md px-6 flex items-center justify-between">
          
          {/* Left Side: Mobile Hamburger & Breadcrumbs */}
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-1.5 text-gray-400 hover:text-white rounded-lg border border-white/5 hover:bg-white/5 transition shrink-0"
              aria-label="Toggle Navigation Menu"
            >
              <Menu size={16} />
            </button>

            {/* Breadcrumbs */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs truncate">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight size={10} className="text-gray-600 shrink-0" />}
                  <span className={idx === breadcrumbs.length - 1 ? 'font-bold text-white truncate' : 'text-gray-500 font-medium shrink-0'}>
                    {crumb}
                  </span>
                </React.Fragment>
              ))}
            </div>
            
            {/* Small view backup breadcrumb title */}
            <div className="sm:hidden text-xs font-extrabold text-white truncate">
              {breadcrumbs[breadcrumbs.length - 1]}
            </div>
          </div>

          {/* Right Side: Quick Action Button & Details */}
          <div className="flex items-center gap-4 relative shrink-0">
            
            {/* Quick Actions Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setIsQuickActionOpen(!isQuickActionOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF7A00] hover:bg-[#FF8C1A] text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition shadow-lg shadow-[#FF7A00]/10 cursor-pointer"
              >
                <Plus size={12} />
                <span className="hidden xs:inline">Quick Action</span>
              </button>
              
              {isQuickActionOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsQuickActionOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl shadow-2xl z-50 p-1 flex flex-col gap-0.5 animate-scale-in">
                    <button
                      onClick={() => handleQuickAction('/admin/candidates')}
                      className="px-3 py-2 text-left text-xs font-bold text-gray-300 hover:text-white hover:bg-white/[0.03] rounded-lg transition w-full cursor-pointer"
                    >
                      + Add Candidate
                    </button>
                    <button
                      onClick={() => handleQuickAction('/admin/clients')}
                      className="px-3 py-2 text-left text-xs font-bold text-gray-300 hover:text-white hover:bg-white/[0.03] rounded-lg transition w-full cursor-pointer"
                    >
                      + Add Client Company
                    </button>
                    <button
                      onClick={() => handleQuickAction('/admin/manual-entry')}
                      className="px-3 py-2 text-left text-xs font-bold text-gray-300 hover:text-white hover:bg-white/[0.03] rounded-lg transition w-full cursor-pointer"
                    >
                      + Manual Attendance Entry
                    </button>
                    <button
                      onClick={() => handleQuickAction('/admin/reports')}
                      className="px-3 py-2 text-left text-xs font-bold text-gray-300 hover:text-white hover:bg-white/[0.03] rounded-lg transition w-full cursor-pointer"
                    >
                      + Generate Attendance Report
                    </button>
                    <button
                      onClick={() => handleQuickAction('/admin/leaves')}
                      className="px-3 py-2 text-left text-xs font-bold text-gray-300 hover:text-white hover:bg-white/[0.03] rounded-lg transition w-full cursor-pointer"
                    >
                      + Book Employee Leave
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Micro details badge */}
            <div className="hidden xs:flex flex-col text-right">
              <span className="text-xs font-bold text-white leading-none">{user?.name}</span>
              <span className="text-[8px] text-[#FF7A00] font-black uppercase tracking-widest mt-1">Admin</span>
            </div>
          </div>
        </header>

        {/* Scrollable Page Canvas Content */}
        <main className="flex-grow p-6 md:p-8 max-w-6xl w-full mx-auto animate-fade-in pb-16">
          {children}
        </main>
      </div>
    </div>
  );
}

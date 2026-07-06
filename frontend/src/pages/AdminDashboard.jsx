import React, { useState, useEffect, useCallback } from 'react';
import { timesheetService } from '../services/timesheetService';
import api from '../services/api';
import LiveStatusWidget from '../components/admin/LiveStatusWidget';
import ResolveExceptionModal from '../components/admin/ResolveExceptionModal';
import Toast from '../components/common/Toast';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserCheck, Briefcase, FileSpreadsheet, 
  ClipboardX, UserPlus, CalendarPlus, FileDown, 
  Calendar, RotateCw, PlusCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ currentlyClockedIn: 0, totalEmployees: 0, activeClients: 0, totalClients: 0, timesheetsSubmittedToday: 0 });
  const [todayLogs, setTodayLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Exception modal state
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [selectedException, setSelectedException] = useState(null);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];

      // Fetch overview operational stats & lists
      const [statsRes, employeesList, todayTimesheets, leavesRes, exceptionsRes] = await Promise.all([
        timesheetService.getAdminStats(),
        timesheetService.getEmployeesList(),
        timesheetService.getAdminTimesheets({ startDate: todayStr, endDate: todayStr }),
        api.get('/admin/leaves'),
        timesheetService.getExceptions()
      ]);

      setStats(statsRes);
      setEmployees(employeesList);
      setTodayLogs(todayTimesheets);
      setLeaves(leavesRes.data || []);
      setExceptions(exceptionsRes);
    } catch (err) {
      console.error(err);
      setToast({ message: 'Error loading dashboard overview.', type: 'error' });
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleResolveClick = (exc) => {
    setSelectedException(exc);
    setIsResolveOpen(true);
  };

  // Quick actions shortcuts
  const quickActions = [
    { label: 'Add Candidate', icon: UserPlus, path: '/admin/candidates', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/10 hover:border-emerald-500/30' },
    { label: 'Add Client', icon: Briefcase, path: '/admin/clients', color: 'text-sky-400 bg-sky-500/10 border-sky-500/10 hover:border-sky-500/30' },
    { label: 'Manual Attendance', icon: CalendarPlus, path: '/admin/manual-entry', color: 'text-[#FF7A00] bg-orange-500/10 border-orange-500/10 hover:border-orange-500/30' },
    { label: 'Generate Report', icon: FileDown, path: '/admin/reports', color: 'text-purple-400 bg-purple-500/10 border-purple-500/10 hover:border-purple-500/30' },
    { label: 'Add Leave', icon: Calendar, path: '/admin/leave', color: 'text-pink-400 bg-pink-500/10 border-pink-500/10 hover:border-pink-500/30' }
  ];

  if (loading) {
    return (
      <div className="min-h-[50vh] w-full flex flex-col items-center justify-center gap-3 text-white">
        <RotateCw className="w-8 h-8 text-[#FF7A00] animate-spin" />
        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Loading dashboard overview...</span>
      </div>
    );
  }

  // Count active leaves today
  const todayStr = new Date().toISOString().split('T')[0];
  const activeLeavesCount = leaves.filter(lf => lf.startDate <= todayStr && lf.endDate >= todayStr).length;

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-white">
      {/* Toast Alert */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:justify-between md:items-center border-b border-[#2A2A2A] pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Manager Overview</h1>
          <p className="text-xs text-[#B3B3B3] mt-1">Operational snapshot of staffing candidates, client MNCs, and live attendance metrics.</p>
        </div>
        <div className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider py-1 px-3 bg-white/5 rounded-full border border-white/5 w-fit">
          System Admin Portal
        </div>
      </div>

      {/* 1. Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Employees */}
        <div className="bg-[#111111] border border-[#2A2A2A] p-6 rounded-2xl flex items-center gap-5 hover:border-[#FF7A00]/40 transition duration-300">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-[#FF7A00] flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-[#B3B3B3] uppercase tracking-wider">Total Candidates</span>
            <span className="text-2xl font-bold text-white mt-1">{stats.totalEmployees}</span>
          </div>
        </div>

        {/* Active Clockins */}
        <div className="bg-[#111111] border border-[#2A2A2A] p-6 rounded-2xl flex items-center gap-5 hover:border-[#FF7A00]/40 transition duration-300">
          <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center shrink-0">
            <UserCheck size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-[#B3B3B3] uppercase tracking-wider">Currently Working</span>
            <span className="text-2xl font-bold text-white mt-1">{stats.currentlyClockedIn}</span>
          </div>
        </div>

        {/* Total Clients */}
        <div className="bg-[#111111] border border-[#2A2A2A] p-6 rounded-2xl flex items-center gap-5 hover:border-[#FF7A00]/40 transition duration-300">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <Briefcase size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-[#B3B3B3] uppercase tracking-wider font-medium">Active Client MNCs</span>
            <span className="text-2xl font-bold text-white mt-1">{stats.totalClients}</span>
          </div>
        </div>

        {/* On Leave Today */}
        <div className="bg-[#111111] border border-[#2A2A2A] p-6 rounded-2xl flex items-center gap-5 hover:border-[#FF7A00]/40 transition duration-300">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
            <Calendar size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-[#B3B3B3] uppercase tracking-wider">On Approved Leave</span>
            <span className="text-2xl font-bold text-white mt-1">{activeLeavesCount}</span>
          </div>
        </div>

      </div>

      {/* 2. Quick Actions Panel */}
      <div className="bg-[#111111] border border-[#2A2A2A] p-5 rounded-2xl shadow-xl">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <PlusCircle size={14} className="text-[#FF7A00]" />
          <span>Quick Actions Shortcuts</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <button
                key={idx}
                onClick={() => navigate(action.path)}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition duration-300 cursor-pointer active:scale-98 ${action.color}`}
              >
                <Icon size={18} />
                <span className="text-[11px] font-bold text-white leading-tight">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Live Employee Status Dashboard */}
      <LiveStatusWidget 
        employees={employees} 
        todayLogs={todayLogs} 
        leaves={leaves}
        onRefresh={() => loadData(true)} 
      />

      {/* 4. Attendance Exceptions Section */}
      {exceptions.length > 0 && (
        <div className="bg-[#111111] border border-[#2A2A2A] p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
            <h3 className="text-xs font-bold text-[#FF7A00] uppercase tracking-widest flex items-center gap-2">
              <ClipboardX size={15} />
              <span>Attendance Exceptions Alert ({exceptions.length})</span>
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exceptions.map((exc) => (
              <div key={exc.id} className="bg-[#1A1A1A] border border-orange-500/20 p-4.5 rounded-2xl flex flex-col gap-3 shadow-md transition-all duration-300 hover:border-orange-500/40">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-white">{exc.employeeName}</h4>
                    <span className="text-[10px] text-gray-500 font-semibold">{exc.clientCompany}</span>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 font-black uppercase rounded-md">
                    {exc.type === 'MISSING_CLOCK_OUT' ? 'Missing Out' : 'Late Arrival'}
                  </span>
                </div>

                <div className="text-xs text-gray-400 bg-black/20 p-3 rounded-xl border border-white/5">
                  <div className="flex justify-between py-1">
                    <span>Shift Date:</span>
                    <span className="font-bold text-white">{exc.date}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Clock In:</span>
                    <span className="font-semibold text-gray-300">{exc.clockIn || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Clock Out:</span>
                    <span className="font-semibold text-gray-300">{exc.clockOut || '-'}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleResolveClick(exc)}
                  className="w-full py-2 bg-white/5 hover:bg-[#FF7A00]/10 border border-white/5 hover:border-[#FF7A00]/40 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Resolve Exception
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exception Resolution Modal */}
      <ResolveExceptionModal
        isOpen={isResolveOpen}
        exception={selectedException}
        onClose={() => {
          setIsResolveOpen(false);
          setSelectedException(null);
        }}
        onSuccess={loadData}
        setToast={setToast}
      />
    </div>
  );
}

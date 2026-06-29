import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { timesheetService } from '../services/timesheetService';
import ClockCard from '../components/employee/ClockCard';
import Toast from '../components/common/Toast';
import { 
  Calendar, 
  TrendingUp, 
  ClipboardList, 
  RotateCw, 
  FolderOpen, 
  User, 
  LayoutDashboard, 
  Download, 
  Smartphone, 
  CheckCircle,
  Cloud,
  CloudOff,
  ChevronRight,
  Clock
} from 'lucide-react';
import { formatDateFriendly, formatTime12h } from '../utils/formatters';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0, total: 0 });
  const [toast, setToast] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if running as standalone
    if (
      window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone
    ) {
      setIsStandalone(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsStandalone(true);
      setDeferredPrompt(null);
      setToast({ message: 'Vergil Tempo installed successfully!', type: 'success' });
    }
  };

  const fetchLogsAndCalculateStats = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const myLogs = await timesheetService.getMyLogs(user.id);
      setLogs(myLogs);

      const todayStr = new Date().toISOString().split('T')[0];

      // 1. Today's Hours (completed shifts)
      const todayHours = myLogs
        .filter((t) => t.date === todayStr && t.clockOut !== null)
        .reduce((sum, current) => sum + (current.hours || 0), 0);

      // 2. Weekly Hours (Sunday to Saturday)
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
      startOfWeek.setHours(0, 0, 0, 0);

      const weekHours = myLogs
        .filter((t) => {
          const logDate = new Date(t.date);
          return logDate >= startOfWeek && t.clockOut !== null;
        })
        .reduce((sum, current) => sum + (current.hours || 0), 0);

      // 3. Monthly Hours (1st of month to today)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const monthHours = myLogs
        .filter((t) => {
          const logDate = new Date(t.date);
          return logDate >= startOfMonth && t.clockOut !== null;
        })
        .reduce((sum, current) => sum + (current.hours || 0), 0);

      setStats({
        today: parseFloat(todayHours.toFixed(2)),
        week: parseFloat(weekHours.toFixed(2)),
        month: parseFloat(monthHours.toFixed(2)),
        total: myLogs.filter(t => t.clockOut !== null).length,
      });
    } catch (err) {
      console.error(err);
      setToast({ message: 'Error retrieving work history logs.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLogsAndCalculateStats();
  }, [fetchLogsAndCalculateStats]);

  const handleRefresh = async () => {
    // If online, run queue sync first
    if (navigator.onLine) {
      try {
        await timesheetService.syncOfflineQueue();
      } catch (e) {
        console.error("Manual refresh sync error", e);
      }
    }
    await fetchLogsAndCalculateStats();
    setToast({ message: 'Timesheet logs updated successfully.', type: 'success' });
  };

  // Get today's log for rendering in Today tab
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLog = logs.find(l => l.date === todayStr);

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-white pb-16 md:pb-0">
      
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="bg-orange-500/10 border border-orange-500/20 text-[#FF7A00] px-5 py-3.5 rounded-xl flex items-center gap-2.5 text-xs font-bold animate-pulse">
          <CloudOff size={16} className="shrink-0" />
          <span>Offline Mode Active. Your attendance actions will be queued locally and automatically synced when connection is restored.</span>
        </div>
      )}
      
      {/* Desktop Tabs Header (Hidden on Mobile) */}
      <div className="hidden md:grid grid-cols-5 gap-2 bg-[#111111] p-1.5 rounded-xl border border-[#2A2A2A] mb-2 w-full">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`px-5 py-3 rounded-lg flex items-center justify-center gap-2.5 text-sm font-semibold transition cursor-pointer ${
            currentTab === 'dashboard' ? 'bg-[#FF7A00] text-white shadow-md shadow-[#FF7A00]/10' : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <LayoutDashboard size={16} />
          <span>Dashboard</span>
        </button>
        <button
          onClick={() => setCurrentTab('clock')}
          className={`px-5 py-3 rounded-lg flex items-center justify-center gap-2.5 text-sm font-semibold transition cursor-pointer ${
            currentTab === 'clock' ? 'bg-[#FF7A00] text-white shadow-md shadow-[#FF7A00]/10' : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Clock size={16} />
          <span>Clock Portal</span>
        </button>
        <button
          onClick={() => setCurrentTab('today')}
          className={`px-5 py-3 rounded-lg flex items-center justify-center gap-2.5 text-sm font-semibold transition cursor-pointer ${
            currentTab === 'today' ? 'bg-[#FF7A00] text-white shadow-md shadow-[#FF7A00]/10' : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <ClipboardList size={16} />
          <span>Today's Shift</span>
        </button>
        <button
          onClick={() => setCurrentTab('history')}
          className={`px-5 py-3 rounded-lg flex items-center justify-center gap-2.5 text-sm font-semibold transition cursor-pointer ${
            currentTab === 'history' ? 'bg-[#FF7A00] text-white shadow-md shadow-[#FF7A00]/10' : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Calendar size={16} />
          <span>Full History</span>
        </button>
        <button
          onClick={() => setCurrentTab('profile')}
          className={`px-5 py-3 rounded-lg flex items-center justify-center gap-2.5 text-sm font-semibold transition cursor-pointer ${
            currentTab === 'profile' ? 'bg-[#FF7A00] text-white shadow-md shadow-[#FF7A00]/10' : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <User size={16} />
          <span>My Profile</span>
        </button>
      </div>


      {/* Main Tab Views */}
      <div className="flex-grow">
        {currentTab === 'dashboard' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Quick Actions Panel */}
            <div className="bg-[#111111] border border-[#2A2A2A] p-6 rounded-2xl shadow-xl">
              <h3 className="text-base font-bold text-white mb-4">Quick Operations</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setCurrentTab('clock')}
                  className="p-4 bg-[#1A1A1A] hover:bg-[#FF7A00]/10 border border-[#2A2A2A] hover:border-[#FF7A00] rounded-xl flex flex-col items-center justify-center gap-2.5 transition text-center cursor-pointer"
                >
                  <Clock size={24} className="text-[#FF7A00]" />
                  <span className="text-xs font-bold text-white">Clock In / Out</span>
                </button>
                <button
                  onClick={() => setCurrentTab('today')}
                  className="p-4 bg-[#1A1A1A] hover:bg-[#FF7A00]/10 border border-[#2A2A2A] hover:border-[#FF7A00] rounded-xl flex flex-col items-center justify-center gap-2.5 transition text-center cursor-pointer"
                >
                  <ClipboardList size={24} className="text-[#FF7A00]" />
                  <span className="text-xs font-bold text-white">Today's Shift</span>
                </button>
              </div>
            </div>

            {/* Upper grid metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Today Hours */}
              <div className="p-6 bg-[#111111] border border-[#2A2A2A] rounded-xl flex items-center gap-5 shadow-lg relative overflow-hidden">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-[#FF7A00] flex items-center justify-center">
                  <Calendar size={22} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-[#B3B3B3] uppercase tracking-wider">Hours Today</span>
                  <span className="text-2xl font-bold text-white mt-1">{stats.today.toFixed(1)}h</span>
                </div>
              </div>

              {/* Weekly Hours */}
              <div className="p-6 bg-[#111111] border border-[#2A2A2A] rounded-xl flex items-center gap-5 shadow-lg relative overflow-hidden">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-[#FF7A00] flex items-center justify-center">
                  <TrendingUp size={22} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-[#B3B3B3] uppercase tracking-wider">Hours This Week</span>
                  <span className="text-2xl font-bold text-white mt-1">{stats.week.toFixed(1)}h</span>
                </div>
              </div>

              {/* Monthly Hours */}
              <div className="p-6 bg-[#111111] border border-[#2A2A2A] rounded-xl flex items-center gap-5 shadow-lg relative overflow-hidden">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-[#FF7A00] flex items-center justify-center">
                  <Calendar size={22} className="text-[#FF7A00]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-[#B3B3B3] uppercase tracking-wider">Hours This Month</span>
                  <span className="text-2xl font-bold text-white mt-1">{stats.month.toFixed(1)}h</span>
                </div>
              </div>

              {/* Total Shifts */}
              <div className="p-6 bg-[#111111] border border-[#2A2A2A] rounded-xl flex items-center gap-5 shadow-lg relative overflow-hidden">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-[#FF7A00] flex items-center justify-center">
                  <ClipboardList size={22} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-[#B3B3B3] uppercase tracking-wider">Shifts Logged</span>
                  <span className="text-2xl font-bold text-white mt-1">{stats.total}</span>
                </div>
              </div>

            </div>


            {/* Recent Activity Logs */}
            <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-[#2A2A2A] flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Recent Work Activity</h3>
                <button 
                  onClick={() => setCurrentTab('history')}
                  className="text-xs text-[#FF7A00] hover:text-[#FF8C1A] flex items-center gap-0.5 font-bold cursor-pointer"
                >
                  <span>View All</span>
                  <ChevronRight size={14} />
                </button>
              </div>
              
              {loading ? (
                <div className="py-8 flex justify-center"><div className="w-6 h-6 border-2 border-[#FF7A00] border-t-transparent rounded-full animate-spin"></div></div>
              ) : logs.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500 italic">No historical shifts logged yet.</div>
              ) : (
                <div className="divide-y divide-[#2A2A2A]">
                  {logs.slice(0, 3).map((log) => (
                    <div key={log.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.01] transition">
                      <div className="flex flex-col gap-1">
                        <div className="text-sm font-semibold text-white">{formatDateFriendly(log.date)}</div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          {formatTime12h(log.clockIn)} - {log.clockOut ? formatTime12h(log.clockOut) : 'Active'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-white">{log.clockOut ? `${log.hours.toFixed(2)} hrs` : 'Active'}</div>
                        <div className="text-[10px] text-[#FF7A00] font-semibold">{log.clientCompany}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {currentTab === 'clock' && (
          <div className="max-w-md mx-auto animate-fade-in">
            <ClockCard onShiftLogged={fetchLogsAndCalculateStats} setToast={setToast} />
          </div>
        )}

        {currentTab === 'today' && (
          <div className="max-w-md mx-auto bg-[#111111] border border-[#2A2A2A] rounded-2xl shadow-xl p-6 animate-fade-in">
            <h3 className="text-lg font-bold text-white mb-6 border-b border-[#2A2A2A] pb-3 flex items-center justify-between">
              <span>Today's Shift Detail</span>
              {todayLog?.isOfflinePending && (
                <span className="flex items-center gap-1 text-xs text-orange-500 font-bold bg-orange-500/10 px-2 py-0.5 rounded-full animate-pulse border border-orange-500/20">
                  <CloudOff size={12} />
                  <span>Pending Sync</span>
                </span>
              )}
              {todayLog && !todayLog.isOfflinePending && (
                <span className="flex items-center gap-1 text-xs text-green-500 font-bold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                  <Cloud size={12} />
                  <span>Synced</span>
                </span>
              )}
            </h3>

            {loading ? (
              <div className="py-12 flex justify-center"><div className="w-8 h-8 border-2 border-[#FF7A00] border-t-transparent rounded-full animate-spin"></div></div>
            ) : !todayLog ? (
              <div className="py-12 text-center text-gray-500 flex flex-col items-center gap-4">
                <FolderOpen size={40} className="text-gray-700 animate-pulse" />
                <p className="text-sm">You haven't clocked in today yet.</p>
                <button
                  onClick={() => setCurrentTab('clock')}
                  className="px-4 py-2 bg-[#FF7A00] hover:bg-[#FF8C1A] text-white text-xs font-bold rounded-xl shadow-lg transition cursor-pointer"
                >
                  Go to Clock Portal
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#2A2A2A]">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Clock In</span>
                    <div className="text-base font-extrabold text-white mt-1 font-mono">{formatTime12h(todayLog.clockIn)}</div>
                  </div>
                  <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#2A2A2A]">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Clock Out</span>
                    <div className="text-base font-extrabold text-white mt-1 font-mono">
                      {todayLog.clockOut ? formatTime12h(todayLog.clockOut) : 'Active now'}
                    </div>
                  </div>
                </div>

                <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#2A2A2A]">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Time</span>
                  <div className="text-lg font-black text-[#FF7A00] mt-1">
                    {todayLog.clockOut ? `${todayLog.hours.toFixed(2)} Hours` : 'Active session...'}
                  </div>
                </div>

                <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#2A2A2A]">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Client Company</span>
                  <div className="text-sm font-bold text-white mt-1">{todayLog.clientCompany}</div>
                </div>

                <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#2A2A2A] relative">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Work Notes</span>
                  <p className="text-xs text-[#B3B3B3] mt-1.5 leading-relaxed italic">
                    {todayLog.notes || 'No notes written for this shift.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {currentTab === 'history' && (
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-[#2A2A2A] flex items-center justify-between bg-black/20">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <ClipboardList size={16} className="text-[#FF7A00]" />
                <span>My Work History Logs</span>
              </h2>
              <button
                onClick={handleRefresh}
                className="p-2 border border-white/10 hover:border-[#FF7A00] hover:bg-[#FF7A00]/10 text-gray-400 hover:text-white rounded-lg transition duration-200 cursor-pointer"
                title="Refresh Logs"
                aria-label="Refresh Logs"
              >
                <RotateCw size={14} />
              </button>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-2 border-[#FF7A00] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-gray-400">Loading history logs...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center text-[#B3B3B3] gap-4">
                <FolderOpen size={48} className="text-gray-700 animate-pulse" />
                <p className="text-xs">No hours logged for you yet. Hit "Clock In" to begin!</p>
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#2A2A2A] bg-black/40 text-[#B3B3B3] uppercase text-[10px] tracking-wider font-bold">
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Clock In</th>
                      <th className="px-6 py-4">Clock Out</th>
                      <th className="px-6 py-4">Hours</th>
                      <th className="px-6 py-4">Client</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2A2A] text-[#B3B3B3]">
                    {logs.map((log, idx) => (
                      <tr key={log.id} className={`hover:bg-white/[0.01] transition ${idx % 2 === 0 ? 'bg-black/10' : ''}`}>
                        <td className="px-6 py-4 font-semibold text-white whitespace-nowrap">{formatDateFriendly(log.date)}</td>
                        <td className="px-6 py-4 font-mono">{formatTime12h(log.clockIn)}</td>
                        <td className="px-6 py-4 font-mono">
                          {log.clockOut ? formatTime12h(log.clockOut) : <span className="text-[#FF7A00] animate-pulse">Active</span>}
                        </td>
                        <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                          {log.clockOut ? `${log.hours.toFixed(2)}h` : '-'}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-400 whitespace-nowrap">{log.clientCompany}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-full border ${
                            log.isOfflinePending
                              ? 'bg-orange-500/10 text-orange-500 border-orange-500/20 animate-pulse'
                              : log.status === 'ACTIVE'
                                ? 'bg-transparent text-white border-white/20'
                                : 'bg-[#FF7A00]/10 text-[#FF7A00] border-[#FF7A00]/20'
                          }`}>
                            {log.isOfflinePending ? 'Offline Pending' : log.status === 'ACTIVE' ? 'Active' : 'Completed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {currentTab === 'profile' && (
          <div className="max-w-md mx-auto flex flex-col gap-6 animate-fade-in">
            {/* Candidate Info Card */}
            <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-[#FF7A00]"></div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-[#FF7A00]/10 border border-[#FF7A00]/20 text-[#FF7A00] flex items-center justify-center text-xl font-bold uppercase">
                  {user.name.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <h4 className="text-base font-bold text-white">{user.name}</h4>
                  <span className="text-xs text-[#B3B3B3] mt-0.5">@{user.username}</span>
                </div>
              </div>

              <div className="divide-y divide-[#2A2A2A] text-xs">
                <div className="py-3.5 flex justify-between">
                  <span className="text-gray-500 font-medium">System Role</span>
                  <span className="font-bold text-white uppercase tracking-wider">{user.role}</span>
                </div>
                <div className="py-3.5 flex justify-between">
                  <span className="text-gray-500 font-medium">Assigned Client</span>
                  <span className="font-bold text-[#FF7A00]">{user.clientCompany || 'N/A'}</span>
                </div>
                <div className="py-3.5 flex justify-between">
                  <span className="text-gray-500 font-medium">Hourly Billing Rate</span>
                  <span className="font-extrabold text-white">${user.rate ? user.rate.toFixed(2) : '0.00'}/hr</span>
                </div>
              </div>
            </div>

            {/* PWA Install Card */}
            <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6 shadow-xl relative overflow-hidden text-center flex flex-col items-center">
              <Smartphone size={36} className="text-[#FF7A00] mb-3 animate-bounce" />
              <h4 className="text-sm font-bold text-white mb-2">PWA Application Support</h4>
              
              {isStandalone ? (
                <div className="mt-2 flex flex-col items-center gap-1.5 bg-green-500/10 border border-green-500/20 p-4 rounded-xl w-full">
                  <CheckCircle size={22} className="text-green-500" />
                  <span className="text-xs font-bold text-green-500">Standalone App Installed</span>
                  <p className="text-[10px] text-gray-400">You are currently running the fullscreen native-grade package on your device.</p>
                </div>
              ) : deferredPrompt ? (
                <div className="mt-2 w-full">
                  <p className="text-xs text-[#B3B3B3] mb-4 leading-relaxed">
                    Install Vergil Tempo onto your device to launch it fullscreen without browser frames and access offline attendance logs.
                  </p>
                  <button
                    onClick={handleInstallClick}
                    className="w-full py-3 bg-[#FF7A00] hover:bg-[#FF8C1A] text-white text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Install Standing App</span>
                  </button>
                </div>
              ) : (
                <div className="mt-2 bg-[#1A1A1A] p-4 rounded-xl border border-[#2A2A2A] text-left w-full text-[11px] leading-relaxed text-[#B3B3B3]">
                  <p className="font-bold text-white mb-1.5">How to install manually:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong>Apple Safari</strong>: Tap <span className="text-white font-bold">Share</span> button, then select <span className="text-[#FF7A00] font-bold">Add to Home Screen</span>.</li>
                    <li><strong>Google Chrome</strong>: Tap menu icon (3 dots), then select <span className="text-[#FF7A00] font-bold">Install app</span> or <span className="text-[#FF7A00] font-bold">Add to Home screen</span>.</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-[#111111]/95 backdrop-blur-lg border-t border-[#2A2A2A] py-2.5 px-4 flex items-center justify-around z-40 shadow-2xl">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`flex flex-col items-center justify-center text-[9px] font-bold tracking-wide transition cursor-pointer ${
            currentTab === 'dashboard' ? 'text-[#FF7A00]' : 'text-gray-500 hover:text-white'
          }`}
        >
          <LayoutDashboard size={18} />
          <span className="mt-1">Dashboard</span>
        </button>
        <button
          onClick={() => setCurrentTab('clock')}
          className={`flex flex-col items-center justify-center text-[9px] font-bold tracking-wide transition cursor-pointer ${
            currentTab === 'clock' ? 'text-[#FF7A00]' : 'text-gray-500 hover:text-white'
          }`}
        >
          <Clock size={18} />
          <span className="mt-1">Clock Portal</span>
        </button>
        <button
          onClick={() => setCurrentTab('today')}
          className={`flex flex-col items-center justify-center text-[9px] font-bold tracking-wide transition cursor-pointer ${
            currentTab === 'today' ? 'text-[#FF7A00]' : 'text-gray-500 hover:text-white'
          }`}
        >
          <ClipboardList size={18} />
          <span className="mt-1">Today</span>
        </button>
        <button
          onClick={() => setCurrentTab('history')}
          className={`flex flex-col items-center justify-center text-[9px] font-bold tracking-wide transition cursor-pointer ${
            currentTab === 'history' ? 'text-[#FF7A00]' : 'text-gray-500 hover:text-white'
          }`}
        >
          <Calendar size={18} />
          <span className="mt-1">History</span>
        </button>
        <button
          onClick={() => setCurrentTab('profile')}
          className={`flex flex-col items-center justify-center text-[9px] font-bold tracking-wide transition cursor-pointer ${
            currentTab === 'profile' ? 'text-[#FF7A00]' : 'text-gray-500 hover:text-white'
          }`}
        >
          <User size={18} />
          <span className="mt-1">Profile</span>
        </button>
      </nav>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

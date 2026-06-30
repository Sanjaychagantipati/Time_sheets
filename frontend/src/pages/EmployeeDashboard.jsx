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
  ChevronDown,
  ChevronUp,
  Clock,
  Briefcase,
  DollarSign
} from 'lucide-react';
import { formatDateFriendly, formatTime12h } from '../utils/formatters';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0, total: 0 });
  const [expandedLogs, setExpandedLogs] = useState({});
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

      // Sum all completed and active session hours for today
      const todayHours = myLogs
        .filter((t) => t.date === todayStr)
        .reduce((sum, current) => sum + (current.hours || 0), 0);

      // Weekly Hours (Sunday to Saturday)
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
      startOfWeek.setHours(0, 0, 0, 0);

      const weekHours = myLogs
        .filter((t) => new Date(t.date) >= startOfWeek)
        .reduce((sum, current) => sum + (current.hours || 0), 0);

      // Monthly Hours (1st of month to today)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const monthHours = myLogs
        .filter((t) => new Date(t.date) >= startOfMonth)
        .reduce((sum, current) => sum + (current.hours || 0), 0);

      setStats({
        today: parseFloat(todayHours.toFixed(2)),
        week: parseFloat(weekHours.toFixed(2)),
        month: parseFloat(monthHours.toFixed(2)),
        total: myLogs.filter(t => t.status === 'COMPLETED').length,
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

  const toggleExpand = (logId) => {
    setExpandedLogs(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }));
  };

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good Morning';
    if (hours < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getTodayDateStr = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLog = logs.find(l => l.date === todayStr);

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-white pb-20 md:pb-0">
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="bg-orange-500/10 border border-orange-500/20 text-[#FF7A00] px-5 py-3.5 rounded-xl flex items-center gap-2.5 text-xs font-bold animate-pulse">
          <CloudOff size={16} className="shrink-0" />
          <span>Offline Mode Active. Your attendance actions will be queued locally and automatically synced when connection is restored.</span>
        </div>
      )}

      {/* Responsive Glassmorphic Tabs Selector */}
      <div className="bg-[#111111] p-1.5 rounded-2xl border border-[#2A2A2A] w-full flex flex-row overflow-x-auto scrollbar-none gap-1">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`flex-1 min-w-[100px] px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer shrink-0 ${
            currentTab === 'dashboard' ? 'bg-[#FF7A00] text-white shadow-md shadow-[#FF7A00]/10' : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <LayoutDashboard size={15} />
          <span>Dashboard</span>
        </button>
        <button
          onClick={() => setCurrentTab('clock')}
          className={`flex-1 min-w-[100px] px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer shrink-0 ${
            currentTab === 'clock' ? 'bg-[#FF7A00] text-white shadow-md shadow-[#FF7A00]/10' : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Clock size={15} />
          <span>Clock Portal</span>
        </button>
        <button
          onClick={() => setCurrentTab('today')}
          className={`flex-1 min-w-[100px] px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer shrink-0 ${
            currentTab === 'today' ? 'bg-[#FF7A00] text-white shadow-md shadow-[#FF7A00]/10' : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <ClipboardList size={15} />
          <span>Today's Shift</span>
        </button>
        <button
          onClick={() => setCurrentTab('history')}
          className={`flex-1 min-w-[100px] px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer shrink-0 ${
            currentTab === 'history' ? 'bg-[#FF7A00] text-white shadow-md shadow-[#FF7A00]/10' : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Calendar size={15} />
          <span>Full History</span>
        </button>
        <button
          onClick={() => setCurrentTab('profile')}
          className={`flex-1 min-w-[100px] px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer shrink-0 ${
            currentTab === 'profile' ? 'bg-[#FF7A00] text-white shadow-md shadow-[#FF7A00]/10' : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <User size={15} />
          <span>My Profile</span>
        </button>
      </div>

      {/* Main Tab Views */}
      <div className="flex-grow">
        
        {/* --- DASHBOARD TAB --- */}
        {currentTab === 'dashboard' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Greeting Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-[#111111] border border-[#2A2A2A] p-5 rounded-2xl shadow-xl">
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-white">{getGreeting()}, {user?.name}</h1>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                  <span>Client Company:</span>
                  <span className="text-[#FF7A00] font-bold">{user?.clientCompany || 'N/A'}</span>
                </p>
              </div>
              <div className="text-left sm:text-right text-[10px] text-gray-400 font-bold uppercase tracking-wider py-1 px-3 bg-white/5 rounded-full border border-white/5 w-fit">
                {getTodayDateStr()}
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-[#111111] border border-[#2A2A2A] p-5 rounded-2xl shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Quick Operations</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setCurrentTab('clock')}
                  className="p-4 bg-[#1A1A1A] hover:bg-[#FF7A00]/5 border border-[#2A2A2A] hover:border-[#FF7A00] rounded-2xl flex flex-col items-center justify-center gap-2.5 transition duration-300 text-center cursor-pointer group"
                >
                  <Clock size={22} className="text-[#FF7A00] group-hover:scale-110 transition duration-300" />
                  <span className="text-xs font-bold text-white">Clock In / Out</span>
                </button>
                <button
                  onClick={() => setCurrentTab('today')}
                  className="p-4 bg-[#1A1A1A] hover:bg-[#FF7A00]/5 border border-[#2A2A2A] hover:border-[#FF7A00] rounded-2xl flex flex-col items-center justify-center gap-2.5 transition duration-300 text-center cursor-pointer group"
                >
                  <ClipboardList size={22} className="text-[#FF7A00] group-hover:scale-110 transition duration-300" />
                  <span className="text-xs font-bold text-white">Today's Shift</span>
                </button>
              </div>
            </div>

            {/* Metrics Responsive Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-[#111111] border border-[#2A2A2A] rounded-2xl flex items-center gap-4 shadow-lg">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#FF7A00] flex items-center justify-center shrink-0">
                  <Clock size={18} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider truncate">Hours Today</span>
                  <span className="text-lg font-black text-white mt-0.5 truncate">{stats.today.toFixed(2)}h</span>
                </div>
              </div>

              <div className="p-5 bg-[#111111] border border-[#2A2A2A] rounded-2xl flex items-center gap-4 shadow-lg">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#FF7A00] flex items-center justify-center shrink-0">
                  <TrendingUp size={18} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider truncate">This Week</span>
                  <span className="text-lg font-black text-white mt-0.5 truncate">{stats.week.toFixed(2)}h</span>
                </div>
              </div>

              <div className="p-5 bg-[#111111] border border-[#2A2A2A] rounded-2xl flex items-center gap-4 shadow-lg">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#FF7A00] flex items-center justify-center shrink-0">
                  <Calendar size={18} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider truncate">This Month</span>
                  <span className="text-lg font-black text-white mt-0.5 truncate">{stats.month.toFixed(2)}h</span>
                </div>
              </div>

              <div className="p-5 bg-[#111111] border border-[#2A2A2A] rounded-2xl flex items-center gap-4 shadow-lg">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#FF7A00] flex items-center justify-center shrink-0">
                  <CheckCircle size={18} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider truncate">Days Logged</span>
                  <span className="text-lg font-black text-white mt-0.5 truncate">{stats.total}</span>
                </div>
              </div>
            </div>

            {/* Compact Recent Activity Panel */}
            <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-xl">
              <div className="px-5 py-4 border-b border-[#2A2A2A] flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Recent Activity</h3>
                <button 
                  onClick={() => setCurrentTab('history')}
                  className="text-xs text-[#FF7A00] hover:text-[#FF8C1A] flex items-center gap-0.5 font-bold cursor-pointer"
                >
                  <span>View Full History</span>
                </button>
              </div>
              
              {loading ? (
                <div className="py-10 flex justify-center"><div className="w-6 h-6 border-2 border-[#FF7A00] border-t-transparent rounded-full animate-spin"></div></div>
              ) : logs.length === 0 ? (
                <div className="p-10 text-center text-xs text-gray-500 italic">No historical shifts logged yet.</div>
              ) : (
                <div className="divide-y divide-[#2A2A2A]">
                  {logs.slice(0, 3).map((log) => (
                    <div key={log.id} className="p-4 flex items-center justify-between hover:bg-white/[0.01] transition">
                      <div className="flex flex-col gap-1">
                        <div className="text-xs font-bold text-white">{log.date === todayStr ? 'Today' : formatDateFriendly(log.date)}</div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          {formatTime12h(log.clockIn)} - {log.clockOut ? formatTime12h(log.clockOut) : 'Active'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-white">{log.hours ? `${log.hours.toFixed(2)} hrs` : 'Active'}</div>
                        <div className="text-[10px] text-[#FF7A00] font-bold">{log.clientCompany}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- CLOCK PORTAL TAB --- */}
        {currentTab === 'clock' && (
          <div className="max-w-md mx-auto animate-fade-in flex flex-col gap-6">
            <ClockCard onShiftLogged={fetchLogsAndCalculateStats} setToast={setToast} />
            
            {/* Show today's sessions list inside clock portal for quick visual confirmation */}
            {todayLog && todayLog.sessions && todayLog.sessions.length > 0 && (
              <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-5 shadow-xl">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3.5 pb-2.5 border-b border-[#2A2A2A]">Today's Work Sessions</h4>
                <div className="space-y-3">
                  {todayLog.sessions.map((sess, idx) => (
                    <div key={sess.id || idx} className="flex justify-between items-center text-xs bg-[#1A1A1A] p-3 rounded-xl border border-[#2A2A2A]">
                      <span className="text-gray-400 font-bold">Session {idx + 1}</span>
                      <span className="font-mono text-white text-[11px] font-semibold">
                        {formatTime12h(sess.clockIn)} - {sess.clockOut ? formatTime12h(sess.clockOut) : 'Active Now'}
                      </span>
                      <span className="text-[#FF7A00] font-black text-[11px]">
                        {sess.hours ? `${sess.hours.toFixed(2)}h` : 'Running'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- TODAY'S SHIFT TAB --- */}
        {currentTab === 'today' && (
          <div className="max-w-md mx-auto bg-[#111111] border border-[#2A2A2A] rounded-2xl shadow-xl p-5 animate-fade-in flex flex-col gap-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 border-b border-[#2A2A2A] pb-3 flex items-center justify-between">
              <span>Today's Shift Detail</span>
              {todayLog?.isOfflinePending && (
                <span className="flex items-center gap-1 text-[9px] text-orange-500 font-black bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                  <CloudOff size={10} />
                  <span>Pending Sync</span>
                </span>
              )}
              {todayLog && !todayLog.isOfflinePending && (
                <span className="flex items-center gap-1 text-[9px] text-green-400 font-black bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                  <Cloud size={10} />
                  <span>Synced</span>
                </span>
              )}
            </h3>

            {loading ? (
              <div className="py-12 flex justify-center"><div className="w-6 h-6 border-2 border-[#FF7A00] border-t-transparent rounded-full animate-spin"></div></div>
            ) : !todayLog ? (
              <div className="py-12 text-center text-gray-500 flex flex-col items-center gap-4">
                <FolderOpen size={36} className="text-gray-700 animate-pulse" />
                <p className="text-xs font-medium">You haven't clocked in today yet.</p>
                <button
                  onClick={() => setCurrentTab('clock')}
                  className="px-4 py-2 bg-[#FF7A00] hover:bg-[#FF8C1A] text-white text-xs font-bold rounded-xl shadow-lg transition cursor-pointer"
                >
                  Go to Clock Portal
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#2A2A2A]">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">First Clock In</span>
                    <div className="text-sm font-extrabold text-white mt-1 font-mono">{formatTime12h(todayLog.clockIn)}</div>
                  </div>
                  <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#2A2A2A]">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Last Clock Out</span>
                    <div className="text-sm font-extrabold text-white mt-1 font-mono">
                      {todayLog.clockOut ? formatTime12h(todayLog.clockOut) : 'Active now'}
                    </div>
                  </div>
                </div>

                <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#2A2A2A]">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Cumulative Hours</span>
                  <div className="text-base font-black text-[#FF7A00] mt-1">
                    {todayLog.hours ? `${todayLog.hours.toFixed(2)} Hours` : '0.00 Hours'}
                  </div>
                </div>

                <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#2A2A2A]">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Client Company</span>
                  <div className="text-xs font-bold text-white mt-1">{todayLog.clientCompany}</div>
                </div>

                {todayLog.notes && (
                  <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#2A2A2A]">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">Work Notes</span>
                    <p className="text-xs text-gray-400 mt-1.5 italic leading-relaxed">{todayLog.notes}</p>
                  </div>
                )}

                {/* Session breakdown for today */}
                {todayLog.sessions && todayLog.sessions.length > 0 && (
                  <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#2A2A2A] space-y-3">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block border-b border-[#2A2A2A] pb-2">Session Shifts Breakdown</span>
                    {todayLog.sessions.map((sess, idx) => (
                      <div key={sess.id || idx} className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-bold">Session {idx + 1}</span>
                        <span className="font-mono text-white">
                          {formatTime12h(sess.clockIn)} - {sess.clockOut ? formatTime12h(sess.clockOut) : 'Active'}
                        </span>
                        <span className="text-[#FF7A00] font-black">{sess.hours ? `${sess.hours.toFixed(2)}h` : 'Active'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* --- FULL HISTORY TAB --- */}
        {currentTab === 'history' && (
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-[#2A2A2A] flex items-center justify-between bg-black/20">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <ClipboardList size={15} className="text-[#FF7A00]" />
                <span>My Work History Logs</span>
              </h2>
              <button
                onClick={handleRefresh}
                className="p-2 border border-white/10 hover:border-[#FF7A00] hover:bg-[#FF7A00]/10 text-gray-400 hover:text-white rounded-lg transition cursor-pointer"
                title="Refresh Logs"
                aria-label="Refresh Logs"
              >
                <RotateCw size={13} />
              </button>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-2 border-[#FF7A00] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-gray-400">Loading history logs...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center text-[#B3B3B3] gap-4">
                <FolderOpen size={40} className="text-gray-700 animate-pulse" />
                <p className="text-xs italic">No hours logged for you yet. Hit "Clock In" to begin!</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {/* Desktop View Table: Visible only on wider screens */}
                <div className="hidden md:block overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#2A2A2A] bg-black/40 text-gray-400 uppercase text-[9px] tracking-wider font-bold">
                        <th className="px-6 py-4 w-[50px]"></th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">First In</th>
                        <th className="px-6 py-4">Last Out</th>
                        <th className="px-6 py-4">Total Hours</th>
                        <th className="px-6 py-4">Client</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2A2A2A] text-gray-300">
                      {logs.map((log) => {
                        const isExpanded = !!expandedLogs[log.id];
                        return (
                          <React.Fragment key={log.id}>
                            <tr className={`hover:bg-white/[0.01] transition ${isExpanded ? 'bg-white/[0.01]' : ''}`}>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => toggleExpand(log.id)}
                                  className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white transition cursor-pointer"
                                >
                                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                              </td>
                              <td className="px-6 py-4 font-semibold text-white whitespace-nowrap">{formatDateFriendly(log.date)}</td>
                              <td className="px-6 py-4 font-mono">{formatTime12h(log.clockIn)}</td>
                              <td className="px-6 py-4 font-mono">
                                {log.clockOut ? formatTime12h(log.clockOut) : <span className="text-[#FF7A00] animate-pulse">Active</span>}
                              </td>
                              <td className="px-6 py-4 font-black text-white whitespace-nowrap">
                                {log.hours ? `${log.hours.toFixed(2)}h` : '-'}
                              </td>
                              <td className="px-6 py-4 font-medium text-gray-500 whitespace-nowrap">{log.clientCompany}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 text-[9px] font-black rounded-full border ${
                                  log.isOfflinePending
                                    ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                                    : log.status === 'ACTIVE'
                                      ? 'bg-transparent text-white border-white/20'
                                      : 'bg-[#FF7A00]/10 text-[#FF7A00] border-[#FF7A00]/20'
                                }`}>
                                  {log.isOfflinePending ? 'Offline' : log.status === 'ACTIVE' ? 'Active' : 'Completed'}
                                </span>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-black/20">
                                <td colSpan={7} className="px-10 py-4">
                                  <div className="space-y-2 max-w-lg">
                                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Detailed Shift History</div>
                                    {log.sessions && log.sessions.length > 0 ? (
                                      log.sessions.map((sess, idx) => (
                                        <div key={sess.id || idx} className="flex justify-between items-center text-xs py-1.5 border-b border-[#2A2A2A] last:border-none">
                                          <span className="text-gray-400 font-bold">Session {idx + 1}</span>
                                          <span className="font-mono text-white text-[11px] font-semibold">
                                            {formatTime12h(sess.clockIn)} - {sess.clockOut ? formatTime12h(sess.clockOut) : 'Active Now'}
                                          </span>
                                          <span className="text-[#FF7A00] font-black text-[11px]">
                                            {sess.hours ? `${sess.hours.toFixed(2)}h` : 'Running'}
                                          </span>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="flex justify-between items-center text-xs py-1.5">
                                        <span className="text-gray-400 font-bold">Session 1</span>
                                        <span className="font-mono text-white text-[11px] font-semibold">
                                          {formatTime12h(log.clockIn)} - {log.clockOut ? formatTime12h(log.clockOut) : 'Active Now'}
                                        </span>
                                        <span className="text-[#FF7A00] font-black text-[11px]">
                                          {log.hours ? `${log.hours.toFixed(2)}h` : 'Running'}
                                        </span>
                                      </div>
                                    )}
                                    {log.notes && (
                                      <div className="pt-2 text-[10px] text-gray-400 italic">
                                        <span className="font-bold text-gray-500 uppercase text-[9px] tracking-wide not-italic block mb-0.5">Notes</span>
                                        {log.notes}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Card List: Visible only on small/medium screens */}
                <div className="md:hidden divide-y divide-[#2A2A2A]">
                  {logs.map((log) => {
                    const isExpanded = !!expandedLogs[log.id];
                    return (
                      <div key={log.id} className="p-4 flex flex-col hover:bg-white/[0.01] transition">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleExpand(log.id)}
                              className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white transition cursor-pointer"
                            >
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-white">{log.date === todayStr ? 'Today' : formatDateFriendly(log.date)}</span>
                              <span className="text-[10px] text-gray-500 font-semibold mt-0.5">{log.clientCompany}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-black text-white">{log.hours ? `${log.hours.toFixed(2)} hrs` : 'Active'}</div>
                            <div className="text-[9px] text-[#FF7A00] font-bold uppercase tracking-wider mt-0.5 font-mono">
                              {formatTime12h(log.clockIn)} - {log.clockOut ? formatTime12h(log.clockOut) : 'Active'}
                            </div>
                          </div>
                        </div>

                        {/* Collapsed/Expanded Session Drill Down */}
                        {isExpanded && (
                          <div className="mt-3.5 bg-black/40 border border-[#2A2A2A]/50 rounded-xl p-3.5 space-y-2.5 animate-slide-down">
                            <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider pb-1 border-b border-white/5">Daily Sessions</div>
                            {log.sessions && log.sessions.length > 0 ? (
                              log.sessions.map((sess, idx) => (
                                <div key={sess.id || idx} className="flex justify-between items-center text-xs">
                                  <span className="text-gray-400 font-bold">Session {idx + 1}</span>
                                  <span className="font-mono text-white text-[11px]">
                                    {formatTime12h(sess.clockIn)} - {sess.clockOut ? formatTime12h(sess.clockOut) : 'Active'}
                                  </span>
                                  <span className="text-[#FF7A00] font-black">
                                    {sess.hours ? `${sess.hours.toFixed(2)}h` : 'Running'}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400 font-bold">Session 1</span>
                                <span className="font-mono text-white text-[11px]">
                                  {formatTime12h(log.clockIn)} - {log.clockOut ? formatTime12h(log.clockOut) : 'Active'}
                                </span>
                                <span className="text-[#FF7A00] font-black">
                                  {log.hours ? `${log.hours.toFixed(2)}h` : 'Running'}
                                </span>
                              </div>
                            )}
                            {log.notes && (
                              <div className="pt-2 border-t border-white/5 text-[10px] text-gray-400 italic">
                                <span className="font-bold text-gray-500 uppercase text-[9px] tracking-wide not-italic block mb-0.5">Notes</span>
                                {log.notes}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- PROFILE TAB --- */}
        {currentTab === 'profile' && (
          <div className="max-w-md mx-auto flex flex-col gap-6 animate-fade-in">
            {/* Candidate Info Card */}
            <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-[#FF7A00]"></div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-[#FF7A00]/10 border border-[#FF7A00]/20 text-[#FF7A00] flex items-center justify-center text-xl font-bold uppercase shrink-0">
                  {user?.name?.charAt(0)}
                </div>
                <div className="flex flex-col truncate">
                  <h4 className="text-base font-bold text-white truncate">{user?.name}</h4>
                  <span className="text-xs text-[#B3B3B3] mt-0.5">@{user?.username}</span>
                </div>
              </div>

              <div className="divide-y divide-[#2A2A2A] text-xs">
                <div className="py-3.5 flex justify-between">
                  <span className="text-gray-500 font-medium">System Role</span>
                  <span className="font-bold text-white uppercase tracking-wider">{user?.role}</span>
                </div>
                <div className="py-3.5 flex justify-between">
                  <span className="text-gray-500 font-medium">Assigned Client</span>
                  <span className="font-bold text-[#FF7A00]">{user?.clientCompany || 'N/A'}</span>
                </div>
                <div className="py-3.5 flex justify-between">
                  <span className="text-gray-500 font-medium">Hourly Billing Rate</span>
                  <span className="font-extrabold text-white">${user?.rate ? user.rate.toFixed(2) : '0.00'}/hr</span>
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

      {/* Mobile Bottom Navigation Bar (Sticky for screens smaller than desktop) */}
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

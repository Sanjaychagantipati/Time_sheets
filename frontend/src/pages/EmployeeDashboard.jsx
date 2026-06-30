import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { timesheetService } from '../services/timesheetService';
import ClockCard from '../components/employee/ClockCard';
import Toast from '../components/common/Toast';
import { 
  Home, 
  History, 
  Clock, 
  Calendar,
  CloudOff,
  FolderOpen,
  RotateCw
} from 'lucide-react';
import { formatDateFriendly, formatTime12h } from '../utils/formatters';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [activeLog, setActiveLog] = useState(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const [toast, setToast] = useState(null);
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

  const checkStatus = useCallback(async () => {
    if (!user) return;
    try {
      const res = await timesheetService.getActiveStatus(user.id);
      setIsClockedIn(res.hasActive);
      setActiveLog(res.log);
    } catch (err) {
      console.error("Failed to check active status", err);
    }
  }, [user]);

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const myLogs = await timesheetService.getMyLogs(user.id);
      setLogs(myLogs);
    } catch (err) {
      console.error(err);
      setToast({ message: 'Error retrieving work history logs.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshData = useCallback(async () => {
    await checkStatus();
    await fetchLogs();
  }, [checkStatus, fetchLogs]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleRefreshHistory = async () => {
    if (navigator.onLine) {
      try {
        await timesheetService.syncOfflineQueue();
      } catch (e) {
        console.error("Sync error", e);
      }
    }
    await fetchLogs();
    setToast({ message: 'Attendance logs updated.', type: 'success' });
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

  // Find active session in today's timesheet (if clocked in)
  const activeSession = todayLog?.sessions?.find(s => s.clockOut === null);

  return (
    <div className="max-w-md mx-auto flex flex-col gap-6 animate-fade-in text-white pb-20 md:pb-6">
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="bg-orange-500/10 border border-orange-500/20 text-[#FF7A00] px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-bold animate-pulse">
          <CloudOff size={15} className="shrink-0" />
          <span>Offline Mode. Attendance events will sync when back online.</span>
        </div>
      )}

      {/* Top Tabs Selector (Desktop) - Home and History only */}
      <div className="hidden md:grid grid-cols-2 gap-2 bg-[#111111] p-1.5 rounded-2xl border border-[#2A2A2A] w-full">
        <button
          onClick={() => setActiveTab('home')}
          className={`py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer ${
            activeTab === 'home' ? 'bg-[#FF7A00] text-white shadow-md shadow-[#FF7A00]/10' : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Home size={14} />
          <span>Home</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer ${
            activeTab === 'history' ? 'bg-[#FF7A00] text-white shadow-md shadow-[#FF7A00]/10' : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <History size={14} />
          <span>History</span>
        </button>
      </div>

      {/* Main Tab Views */}
      <div className="w-full flex-grow">
        
        {/* --- HOME VIEW --- */}
        {activeTab === 'home' && (
          <div className="flex flex-col gap-5 animate-fade-in">
            {/* Welcome Section */}
            <div className="bg-[#111111] border border-[#2A2A2A] p-5 rounded-2xl shadow-xl flex flex-col gap-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[2.5px] bg-[#FF7A00]"></div>
              <div className="text-right text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                {getTodayDateStr()}
              </div>
              <h2 className="text-lg font-extrabold tracking-tight text-white">{getGreeting()}, {user?.name}</h2>
              <div className="flex flex-col gap-1 text-[11px] text-gray-400 mt-1 font-semibold">
                <div>Employee ID: <span className="text-white font-mono">{user?.username || user?.id}</span></div>
                <div>Assigned Client: <span className="text-[#FF7A00]">{user?.clientCompany || 'N/A'}</span></div>
              </div>
            </div>

            {/* Attendance Status Card */}
            <div className="bg-[#111111] border border-[#2A2A2A] p-5 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3 mb-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Attendance Status</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                  isClockedIn 
                    ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                    : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isClockedIn ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></span>
                  {isClockedIn ? 'Working' : 'Not Working'}
                </span>
              </div>
              
              <div className="flex flex-col gap-3 text-xs">
                <div className="flex justify-between items-center bg-[#1A1A1A] p-3 rounded-xl border border-[#2A2A2A]">
                  <span className="text-gray-500 font-bold uppercase text-[9px] tracking-wide">Current Session</span>
                  <span className="text-white font-mono font-semibold">
                    {isClockedIn && activeSession 
                      ? `In at ${formatTime12h(activeSession.clockIn)}` 
                      : 'No active session'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center bg-[#1A1A1A] p-3 rounded-xl border border-[#2A2A2A]">
                  <span className="text-gray-500 font-bold uppercase text-[9px] tracking-wide">Today's Total Hours</span>
                  <span className="text-[#FF7A00] font-black font-mono">
                    {todayLog ? `${todayLog.hours.toFixed(2)} hrs` : '0.00 hrs'}
                  </span>
                </div>
              </div>
            </div>

            {/* Large Primary Toggle Clock Button Container */}
            <div className="w-full">
              <ClockCard onShiftLogged={refreshData} setToast={setToast} />
            </div>
          </div>
        )}

        {/* --- HISTORY VIEW --- */}
        {activeTab === 'history' && (
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-2xl animate-fade-in">
            <div className="px-5 py-4 border-b border-[#2A2A2A] flex items-center justify-between bg-black/20">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <Clock size={15} className="text-[#FF7A00]" />
                <span>Attendance History</span>
              </h3>
              <button
                onClick={handleRefreshHistory}
                disabled={loading}
                className="p-2 border border-white/10 hover:border-[#FF7A00] hover:bg-[#FF7A00]/10 text-gray-400 hover:text-white rounded-lg transition cursor-pointer disabled:opacity-50"
                title="Sync & Refresh History"
                aria-label="Sync & Refresh History"
              >
                <RotateCw size={13} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {loading && logs.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-2 border-[#FF7A00] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-gray-400">Loading history logs...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center text-gray-500 gap-4">
                <FolderOpen size={40} className="text-gray-700 animate-pulse" />
                <p className="text-xs italic">No history records logged yet.</p>
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="divide-y divide-[#2A2A2A]">
                  {logs.slice(0, visibleCount).map((log) => {
                    const isToday = log.date === todayStr;
                    const isYesterday = log.date === new Date(Date.now() - 86400000).toISOString().split('T')[0];
                    
                    let dateLabel = formatDateFriendly(log.date);
                    if (isToday) dateLabel = 'Today';
                    else if (isYesterday) dateLabel = 'Yesterday';

                    return (
                      <div key={log.id} className="p-4 flex flex-col hover:bg-white/[0.01] transition">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-white flex items-center gap-1.5">
                              <span>{dateLabel}</span>
                              {log.isOfflinePending && (
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" title="Offline Pending Sync" />
                              )}
                            </span>
                            <span className="text-[10px] text-gray-500 font-semibold mt-0.5">{log.clientCompany}</span>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-sm font-black text-white">{log.hours ? `${log.hours.toFixed(2)} hrs` : 'Active'}</div>
                            <div className="text-[9px] text-gray-400 font-bold mt-0.5 font-mono">
                              In: {formatTime12h(log.clockIn)} {log.clockOut ? `| Out: ${formatTime12h(log.clockOut)}` : ''}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {logs.length > visibleCount && (
                  <div className="p-4 border-t border-[#2A2A2A] text-center bg-black/10">
                    <button
                      onClick={() => setVisibleCount(prev => prev + 5)}
                      className="text-xs text-[#FF7A00] hover:text-[#FF8C1A] font-bold transition cursor-pointer"
                    >
                      Load More
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Bottom Sticky Navigation Bar (Mobile only) */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-[#111111]/95 backdrop-blur-lg border-t border-[#2A2A2A] py-2.5 px-4 flex items-center justify-around z-40 shadow-2xl">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center text-[10px] font-bold tracking-wide transition cursor-pointer ${
            activeTab === 'home' ? 'text-[#FF7A00]' : 'text-gray-500 hover:text-white'
          }`}
        >
          <Home size={18} />
          <span className="mt-1">Home</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center justify-center text-[10px] font-bold tracking-wide transition cursor-pointer ${
            activeTab === 'history' ? 'text-[#FF7A00]' : 'text-gray-500 hover:text-white'
          }`}
        >
          <History size={18} />
          <span className="mt-1">History</span>
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

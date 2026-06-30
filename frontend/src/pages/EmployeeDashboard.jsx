import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { timesheetService } from '../services/timesheetService';
import ClockCard from '../components/employee/ClockCard';
import Toast from '../components/common/Toast';
import { 
  Clock, 
  Calendar,
  CloudOff,
  FolderOpen,
  RotateCw
} from 'lucide-react';
import { formatDateFriendly, formatTime12h } from '../utils/formatters';

export default function EmployeeDashboard() {
  const { user } = useAuth();
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
    <div className="max-w-md mx-auto flex flex-col gap-6 animate-fade-in text-white pb-10 w-full px-1">
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="bg-orange-500/10 border border-orange-500/20 text-[#FF7A00] px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-bold animate-pulse">
          <CloudOff size={15} className="shrink-0" />
          <span>Offline Mode. Attendance events will sync when back online.</span>
        </div>
      )}

      {/* SECTION 1: Welcome Header */}
      <div className="bg-[#111111] border border-[#2A2A2A] p-5 rounded-2xl shadow-xl flex flex-col gap-2.5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2.5px] bg-[#FF7A00]"></div>
        <div className="flex justify-between items-start gap-2">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-white">{getGreeting()}, {user?.name}</h2>
            <div className="flex flex-col gap-0.5 text-[10px] text-gray-400 mt-1.5 font-bold uppercase tracking-wider">
              <div>Assigned Client: <span className="text-[#FF7A00]">{user?.clientCompany || 'N/A'}</span></div>
            </div>
          </div>
          <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-sm ${
            isClockedIn 
              ? 'bg-green-500/10 text-green-400 border-green-500/20' 
              : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isClockedIn ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></span>
            <span>{isClockedIn ? 'Working' : 'Not Clocked In'}</span>
          </div>
        </div>
        <div className="border-t border-[#2A2A2A] pt-2 text-[10px] text-gray-500 font-extrabold uppercase tracking-wide flex justify-between">
          <span>Date: {getTodayDateStr()}</span>
          <span>ID: {user?.username}</span>
        </div>
      </div>

      {/* SECTION 2: Attendance Card */}
      <div className="bg-[#111111] border border-[#2A2A2A] p-5 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3 mb-4">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Today's Summary</span>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
            {isClockedIn && activeSession 
              ? `Active since ${formatTime12h(activeSession.clockIn)}` 
              : 'No active session'}
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="flex flex-col bg-[#1A1A1A] py-3 rounded-xl border border-[#2A2A2A]">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">First In</span>
            <span className="text-xs font-extrabold text-white mt-1.5 font-mono">
              {todayLog ? formatTime12h(todayLog.clockIn) : '--:--'}
            </span>
          </div>
          <div className="flex flex-col bg-[#1A1A1A] py-3 rounded-xl border border-[#2A2A2A]">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">Last Out</span>
            <span className="text-xs font-extrabold text-white mt-1.5 font-mono">
              {todayLog && todayLog.clockOut && !isClockedIn ? formatTime12h(todayLog.clockOut) : '--:--'}
            </span>
          </div>
          <div className="flex flex-col bg-[#1A1A1A] py-3 rounded-xl border border-[#2A2A2A]">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">Total Hours</span>
            <span className="text-xs font-black text-[#FF7A00] mt-1.5">
              {todayLog ? `${todayLog.hours.toFixed(2)}h` : '0.00h'}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 3: Clock Button */}
      <div className="w-full">
        <ClockCard onShiftLogged={refreshData} setToast={setToast} />
      </div>

      {/* SECTION 4: Attendance History */}
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-[#2A2A2A] flex items-center justify-between bg-black/20">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
            <Calendar size={15} className="text-[#FF7A00]" />
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

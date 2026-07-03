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
  RotateCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatDateFriendly, formatTime12h } from '../utils/formatters';
import AttendanceTimeline from '../components/common/AttendanceTimeline';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [activeLog, setActiveLog] = useState(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const [toast, setToast] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [expandedLogIds, setExpandedLogIds] = useState([]);

  const toggleLogExpand = (logId) => {
    setExpandedLogIds(prev => 
      prev.includes(logId) ? prev.filter(id => id !== logId) : [...prev, logId]
    );
  };


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

  const [todayHolidayName, setTodayHolidayName] = useState('');

  const checkHoliday = useCallback(async () => {
    try {
      const activeHolidays = await timesheetService.getActiveHolidaysList();
      const localTodayStr = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
      const holiday = activeHolidays.find(h => h.holidayDate === localTodayStr);
      if (holiday) {
        setTodayHolidayName(holiday.holidayName);
      } else {
        setTodayHolidayName('');
      }
    } catch (err) {
      console.error("Error checking holiday status", err);
    }
  }, []);

  const checkStatus = useCallback(async () => {
    if (!user) return;
    try {
      const res = await timesheetService.getActiveClockIn(user.id);
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
    await checkHoliday();
    await checkStatus();
    await fetchLogs();
  }, [checkHoliday, checkStatus, fetchLogs]);

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
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in text-white pb-10 px-4">
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="bg-orange-500/10 border border-orange-500/20 text-[#FF7A00] px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-bold animate-pulse">
          <CloudOff size={16} className="shrink-0" />
          <span>Offline Mode. Attendance events will sync when back online.</span>
        </div>
      )}

      {/* Holiday Alert Banner */}
      {todayHolidayName && (
        <div className="bg-orange-500/10 border border-[#FF7A00]/30 text-[#FF7A00] px-5 py-4 rounded-xl flex flex-col gap-1 text-sm animate-fade-in">
          <div className="font-extrabold uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FF7A00] animate-pulse shadow-[0_0_8px_#FF7A00]" />
            <span>Today is a Company Holiday</span>
          </div>
          <p className="text-gray-300 text-xs font-semibold">
            {todayHolidayName} (Clock-in and attendance logging features are disabled for today).
          </p>
        </div>
      )}

      {/* Main Grid Layout: Left Column (Welcome + Clock) & Right Column (Summary + History) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        
        {/* Left Column (2/5 columns on desktop) */}
        <div className="lg:col-span-2 flex flex-col gap-6 w-full">
          {/* Welcome Header */}
          <div className="bg-[#111111] border border-[#2A2A2A] p-6 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:border-[#FF7A00]/20 w-full">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-[#FF7A00]"></div>
            <div>
              <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1">Welcome back</span>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">{getGreeting()}, {user?.name}</h2>
            </div>
            <div className="border-t border-[#2A2A2A] pt-4 mt-6 flex items-center justify-between text-sm text-gray-400">
              <div>Assigned Client: <span className="text-[#FF7A00] font-bold">{user?.clientCompany || 'N/A'}</span></div>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{getTodayDateStr()}</div>
            </div>
          </div>

          {/* Clock Button Card */}
          <div className="w-full">
            <ClockCard onShiftLogged={refreshData} setToast={setToast} isHoliday={!!todayHolidayName} holidayName={todayHolidayName} />
          </div>
        </div>

        {/* Right Column (3/5 columns on desktop) */}
        <div className="lg:col-span-3 flex flex-col gap-6 w-full">
          {/* Today's Summary (3 compact cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#111111] border border-[#2A2A2A] p-4.5 rounded-2xl shadow-xl flex flex-col gap-1 text-center sm:text-left transition-all duration-300 hover:border-[#FF7A00]/20">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Today's First In</span>
              <span className="text-lg font-extrabold text-white font-mono mt-1">
                {todayLog && todayLog.clockIn ? formatTime12h(todayLog.clockIn) : '--'}
              </span>
            </div>
            <div className="bg-[#111111] border border-[#2A2A2A] p-4.5 rounded-2xl shadow-xl flex flex-col gap-1 text-center sm:text-left transition-all duration-300 hover:border-[#FF7A00]/20">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Today's Last Out</span>
              <span className="text-lg font-extrabold text-white font-mono mt-1">
                {todayLog && todayLog.clockOut ? formatTime12h(todayLog.clockOut) : '--'}
              </span>
            </div>
            <div className="bg-[#111111] border border-[#2A2A2A] p-4.5 rounded-2xl shadow-xl flex flex-col gap-1 text-center sm:text-left transition-all duration-300 hover:border-[#FF7A00]/20">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Today's Total Hours</span>
              <span className="text-lg font-black text-[#FF7A00] font-mono mt-1">
                {todayLog && todayLog.clockIn ? `${(todayLog.hours || 0).toFixed(2)} hrs` : '--'}
              </span>
            </div>
          </div>

          {/* Attendance History Table */}
          <div className="w-full bg-[#111111] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 hover:border-[#FF7A00]/10">
            <div className="px-5 py-4 border-b border-[#2A2A2A] flex items-center justify-between bg-black/20">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <Calendar size={15} className="text-[#FF7A00]" />
                <span>Attendance History</span>
              </h3>
              <button
                onClick={handleRefreshHistory}
                disabled={loading}
                className="p-2 border border-white/10 hover:border-[#FF7A00] hover:bg-[#FF7A00]/10 text-gray-400 hover:text-white rounded-xl transition cursor-pointer disabled:opacity-50"
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

                    const isExpanded = expandedLogIds.includes(log.id);

                    return (
                      <div 
                        key={log.id} 
                        onClick={() => toggleLogExpand(log.id)}
                        className="p-4 flex flex-col hover:bg-white/[0.02] cursor-pointer transition duration-150 select-none"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-bold text-white flex items-center gap-1.5">
                              <span>{dateLabel}</span>
                              {log.isOfflinePending && (
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" title="Offline Pending Sync" />
                              )}
                              {isExpanded ? <ChevronUp size={14} className="text-gray-500 ml-1" /> : <ChevronDown size={14} className="text-gray-500 ml-1" />}
                            </span>
                            <span className="text-[10px] text-gray-500 font-semibold">{log.clientCompany}</span>
                          </div>
                          
                          <div className="text-right flex flex-col gap-0.5">
                            <div className="text-sm font-black text-white">
                              {log.hours !== null && log.hours !== undefined ? `${Number(log.hours).toFixed(2)} hrs` : 'Active'}
                            </div>
                            <div className="text-[9px] text-gray-400 font-bold font-mono">
                              In: {formatTime12h(log.clockIn)} {log.clockOut ? `| Out: ${formatTime12h(log.clockOut)}` : ''}
                            </div>
                          </div>
                        </div>
                        {isExpanded && <AttendanceTimeline log={log} />}
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
        </div>

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

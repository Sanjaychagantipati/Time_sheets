import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { timesheetService } from '../services/timesheetService';
import ClockCard from '../components/employee/ClockCard';
import Toast from '../components/common/Toast';
import { 
  Calendar, 
  ClipboardList, 
  RotateCw, 
  FolderOpen, 
  Cloud,
  CloudOff,
  ChevronDown,
  ChevronUp,
  Clock
} from 'lucide-react';
import { formatDateFriendly, formatTime12h } from '../utils/formatters';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogs, setExpandedLogs] = useState({});
  const [visibleCount, setVisibleCount] = useState(5);
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

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleRefresh = async () => {
    if (navigator.onLine) {
      try {
        await timesheetService.syncOfflineQueue();
      } catch (e) {
        console.error("Manual refresh sync error", e);
      }
    }
    await fetchLogs();
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
    <div className="flex flex-col gap-6 animate-fade-in text-white w-full">
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="bg-orange-500/10 border border-orange-500/20 text-[#FF7A00] px-5 py-3.5 rounded-xl flex items-center gap-2.5 text-xs font-bold animate-pulse">
          <CloudOff size={16} className="shrink-0" />
          <span>Offline Mode Active. Your attendance actions will be queued locally and automatically synced when connection is restored.</span>
        </div>
      )}

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        
        {/* Left Column: Greeting, Clock Card, and Today's Sessions */}
        <div className="lg:col-span-2 flex flex-col gap-6 w-full">
          {/* Greeting Card */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-[#111111] border border-[#2A2A2A] p-5 rounded-2xl shadow-xl">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white">{getGreeting()}, {user?.name}</h1>
              <p className="text-xs text-gray-400 mt-1">
                Client Company: <span className="text-[#FF7A00] font-semibold">{user?.clientCompany || 'N/A'}</span>
              </p>
            </div>
            <div className="text-left sm:text-right text-[10px] text-gray-400 font-bold uppercase tracking-wider py-1 px-3 bg-white/5 rounded-full border border-white/5 w-fit">
              {getTodayDateStr()}
            </div>
          </div>

          {/* Clock Portal Card */}
          <div className="w-full">
            <ClockCard onShiftLogged={fetchLogs} setToast={setToast} />
          </div>

          {/* Today's Active/Completed Sessions Breakdown */}
          {todayLog && todayLog.sessions && todayLog.sessions.length > 0 && (
            <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-5 shadow-xl">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3.5 pb-2.5 border-b border-[#2A2A2A] flex items-center justify-between">
                <span>Today's Sessions Breakdown</span>
                {todayLog?.isOfflinePending ? (
                  <span className="flex items-center gap-1 text-[9px] text-orange-500 font-black bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                    <CloudOff size={10} />
                    <span>Pending Sync</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[9px] text-green-400 font-black bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                    <Cloud size={10} />
                    <span>Synced</span>
                  </span>
                )}
              </h4>
              <div className="space-y-3">
                {todayLog.sessions.map((sess, idx) => (
                  <div key={sess.id || idx} className="flex justify-between items-center text-xs bg-[#1A1A1A] p-3.5 rounded-xl border border-[#2A2A2A]">
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

        {/* Right Column: Full Attendance Logs History */}
        <div className="lg:col-span-3 w-full bg-[#111111] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-5 py-4 border-b border-[#2A2A2A] flex items-center justify-between bg-black/20">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <ClipboardList size={15} className="text-[#FF7A00]" />
              <span>My Attendance Logs</span>
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

          {loading && logs.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-[#FF7A00] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-gray-400">Loading history logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center text-gray-500 gap-4">
              <FolderOpen size={40} className="text-gray-700 animate-pulse" />
              <p className="text-xs italic">No hours logged for you yet. Clock in above to begin!</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Responsive Layout for Attendance Logs List */}
              <div className="divide-y divide-[#2A2A2A]">
                {logs.slice(0, visibleCount).map((log) => {
                  const isExpanded = !!expandedLogs[log.id];
                  const isToday = log.date === todayStr;
                  const isYesterday = log.date === new Date(Date.now() - 86400000).toISOString().split('T')[0];
                  
                  let dateLabel = formatDateFriendly(log.date);
                  if (isToday) dateLabel = 'Today';
                  else if (isYesterday) dateLabel = 'Yesterday';

                  return (
                    <div key={log.id} className="p-4 flex flex-col hover:bg-white/[0.01] transition">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleExpand(log.id)}
                            className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white transition cursor-pointer"
                            aria-label="Toggle sessions detail"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-white flex items-center gap-1.5">
                              <span>{dateLabel}</span>
                              {log.isOfflinePending && (
                                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" title="Offline Pending Sync" />
                              )}
                            </span>
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

                      {/* Expanded Sessions Drill Down */}
                      {isExpanded && (
                        <div className="mt-3.5 bg-black/40 border border-[#2A2A2A]/50 rounded-xl p-3.5 space-y-2.5 animate-slide-down">
                          <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider pb-1 border-b border-white/5">Daily Session Breakdown</div>
                          {log.sessions && log.sessions.length > 0 ? (
                            log.sessions.map((sess, idx) => (
                              <div key={sess.id || idx} className="flex justify-between items-center text-xs">
                                <span className="text-gray-400 font-bold">Session {idx + 1}</span>
                                <span className="font-mono text-white text-[11px]">
                                  {formatTime12h(sess.clockIn)} - {sess.clockOut ? formatTime12h(sess.clockOut) : 'Active Now'}
                                </span>
                                <span className="text-[#FF7A00] font-black text-[11px]">
                                  {sess.hours ? `${sess.hours.toFixed(2)}h` : 'Running'}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-400 font-bold">Session 1</span>
                              <span className="font-mono text-white text-[11px]">
                                {formatTime12h(log.clockIn)} - {log.clockOut ? formatTime12h(log.clockOut) : 'Active Now'}
                              </span>
                              <span className="text-[#FF7A00] font-black text-[11px]">
                                {log.hours ? `${log.hours.toFixed(2)}h` : 'Running'}
                              </span>
                            </div>
                          )}
                          {log.notes && (
                            <div className="pt-2 border-t border-white/5 text-[10px] text-gray-400 italic leading-relaxed">
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

              {/* Load More Logs Pagination */}
              {logs.length > visibleCount && (
                <div className="p-4 border-t border-[#2A2A2A] text-center bg-black/10">
                  <button
                    onClick={() => setVisibleCount(prev => prev + 5)}
                    className="text-xs text-[#FF7A00] hover:text-[#FF8C1A] font-bold transition cursor-pointer"
                  >
                    Load more logs...
                  </button>
                </div>
              )}
            </div>
          )}
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

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { timesheetService } from '../services/timesheetService';
import Toast from '../components/common/Toast';
import { 
  Play, 
  Square, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Cloud, 
  CloudOff, 
  Smartphone,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { formatDateFriendly, formatTime12h } from '../utils/formatters';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [activeLog, setActiveLog] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState({});
  const [visibleCount, setVisibleCount] = useState(5);
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
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    checkStatus();
    fetchLogs();
  }, [checkStatus, fetchLogs]);

  const handleClockIn = async () => {
    try {
      setSubmitting(true);
      await timesheetService.clockIn(user.id);
      setToast({ message: 'Successfully Clocked In!', type: 'success' });
      await checkStatus();
      await fetchLogs();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Failed to clock in.';
      setToast({ message: errMsg, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setSubmitting(true);
      const res = await timesheetService.clockOut(user.id, notes);
      setNotes('');
      setToast({ message: `Clocked Out. Hours Logged: ${res.log.hours}h`, type: 'success' });
      await checkStatus();
      await fetchLogs();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Failed to clock out.';
      setToast({ message: errMsg, type: 'error' });
    } finally {
      setSubmitting(false);
      setShowConfirm(false);
    }
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
    <div className="max-w-md mx-auto flex flex-col gap-5 animate-fade-in text-white pb-8">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-orange-500/10 border border-orange-500/20 text-[#FF7A00] px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-bold animate-pulse">
          <CloudOff size={15} className="shrink-0" />
          <span>Offline mode active. Operations will queue and sync later.</span>
        </div>
      )}

      {/* PWA Install Banner */}
      {!isStandalone && deferredPrompt && (
        <div className="bg-gradient-to-r from-[#FF7A00]/20 to-[#FF7A00]/5 border border-[#FF7A00]/20 p-4 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FF7A00]/10 flex items-center justify-center text-[#FF7A00]">
              <Smartphone size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Install Vergil Tempo</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Quick access directly from your home screen</div>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="px-3.5 py-1.5 bg-[#FF7A00] hover:bg-[#FF8C1A] text-white text-[10px] font-bold rounded-lg shadow-md transition cursor-pointer"
          >
            Install
          </button>
        </div>
      )}

      {/* Greeting and welcome info */}
      <div className="flex justify-between items-start pt-2 px-1">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white">{getGreeting()}, {user?.name}</h1>
          <p className="text-xs text-gray-400 mt-1">
            Client Company: <span className="text-[#FF7A00] font-semibold">{user?.clientCompany || 'N/A'}</span>
          </p>
        </div>
        <div className="text-right text-[10px] text-gray-400 font-bold uppercase tracking-wider py-1 px-2.5 bg-white/5 rounded-full border border-white/5">
          {getTodayDateStr()}
        </div>
      </div>

      {/* Today's Summary Card */}
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3.5 mb-4">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Today's Progress</span>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
            isClockedIn 
              ? 'bg-[#FF7A00]/10 text-[#FF7A00] border border-[#FF7A00]/20 animate-pulse' 
              : (todayLog ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20')
          }`}>
            {isClockedIn ? 'Active Now' : (todayLog ? 'Completed' : 'Not Started')}
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
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">Worked Today</span>
            <span className="text-xs font-black text-[#FF7A00] mt-1.5">
              {todayLog ? `${todayLog.hours.toFixed(2)}h` : '0.00h'}
            </span>
          </div>
        </div>
      </div>

      {/* Large Primary Action Button */}
      <div className="bg-[#111111] border border-[#2A2A2A] p-6 rounded-2xl shadow-xl flex flex-col items-center">
        {isClockedIn && (
          <div className="mb-4 flex flex-col gap-1.5 w-full">
            <label htmlFor="shift-notes" className="text-left text-[10px] font-bold text-[#B3B3B3] uppercase tracking-wider">
              Shift Notes / Tasks accomplished
            </label>
            <textarea
              id="shift-notes"
              name="notes"
              className="bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl p-3.5 text-xs focus:outline-none focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] transition resize-none w-full"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you work on during this session?"
              rows={2}
              maxLength={250}
            />
          </div>
        )}

        <button
          onClick={isClockedIn ? () => setShowConfirm(true) : handleClockIn}
          disabled={submitting}
          className={`w-full py-4 text-base font-bold rounded-xl flex items-center justify-center gap-2 transition duration-300 cursor-pointer disabled:cursor-not-allowed ${
            isClockedIn
              ? 'bg-[#2A2A2A] hover:bg-[#333333] text-white border border-[#3A3A3A] hover:shadow-[0_0_15px_rgba(255,122,0,0.1)]'
              : 'bg-[#FF7A00] hover:bg-[#FF8C1A] text-white hover:shadow-[0_0_15px_rgba(255,122,0,0.35)] shadow-lg shadow-[#FF7A00]/10'
          }`}
        >
          {isClockedIn ? <Square size={16} /> : <Play size={16} />}
          <span>
            {submitting 
              ? (isClockedIn ? 'Clocking Out...' : 'Clocking In...') 
              : (isClockedIn ? 'Clock Out' : 'Clock In')}
          </span>
        </button>
      </div>

      {/* Recent History / My Attendance */}
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-[#2A2A2A]">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar size={15} className="text-[#FF7A00]" />
            <span>My Attendance History</span>
          </h3>
        </div>

        {loading && logs.length === 0 ? (
          <div className="py-12 flex justify-center">
            <div className="w-6 h-6 border-2 border-[#FF7A00] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center text-xs text-gray-500 italic">No attendance history logged yet.</div>
        ) : (
          <div className="divide-y divide-[#2A2A2A]">
            {logs.slice(0, visibleCount).map((log) => {
              const isToday = log.date === todayStr;
              const isYesterday = log.date === new Date(Date.now() - 86400000).toISOString().split('T')[0];
              
              let dayLabel = formatDateFriendly(log.date);
              if (isToday) dayLabel = 'Today';
              else if (isYesterday) dayLabel = 'Yesterday';

              const isExpanded = !!expandedLogs[log.id];

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
                        <div className="text-sm font-bold text-white flex items-center gap-1.5">
                          <span>{dayLabel}</span>
                          {log.isOfflinePending && (
                            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" title="Offline Pending Sync" />
                          )}
                        </div>
                        <div className="text-[10px] text-gray-500 font-semibold mt-0.5">{log.clientCompany}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-white">{log.hours ? `${log.hours.toFixed(2)} hrs` : 'Active'}</div>
                      <div className="text-[9px] text-[#FF7A00] font-bold uppercase tracking-wider mt-0.5 font-mono">
                        {formatTime12h(log.clockIn)} - {log.clockOut ? formatTime12h(log.clockOut) : 'Active'}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Breakdown */}
                  {isExpanded && (
                    <div className="mt-3.5 bg-black/40 border border-[#2A2A2A]/50 rounded-xl p-3.5 space-y-2.5 animate-slide-down">
                      <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider pb-1 border-b border-white/5">
                        Daily Session Log
                      </div>
                      {log.sessions && log.sessions.length > 0 ? (
                        log.sessions.map((sess, idx) => (
                          <div key={sess.id || idx} className="flex justify-between items-center text-xs">
                            <span className="text-gray-400 font-bold">Session {idx + 1}</span>
                            <span className="font-mono text-white text-[11px] font-semibold">
                              {formatTime12h(sess.clockIn)} - {sess.clockOut ? formatTime12h(sess.clockOut) : 'Working Now'}
                            </span>
                            <span className="text-[#FF7A00] font-black text-[11px]">
                              {sess.hours ? `${sess.hours.toFixed(2)}h` : 'Running'}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400 font-bold">Session 1</span>
                          <span className="font-mono text-white text-[11px] font-semibold">
                            {formatTime12h(log.clockIn)} - {log.clockOut ? formatTime12h(log.clockOut) : 'Working Now'}
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
        )}

        {/* Load More Button */}
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

      {/* Clock Out Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/85 backdrop-blur-sm animate-fade-in" 
            onClick={() => !submitting && setShowConfirm(false)}
          ></div>
          
          <div className="relative z-10 w-full max-w-sm bg-[#111111] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-2xl p-6 animate-scale-in text-center">
            <div className="w-12 h-12 rounded-full bg-orange-500/10 text-[#FF7A00] flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} />
            </div>
            
            <h3 className="text-lg font-bold text-white mb-3">Confirm Clock Out</h3>
            
            <div className="text-sm text-[#B3B3B3] mb-6 space-y-2 leading-relaxed">
              <p>Are you sure you want to clock out?</p>
              <p>Please verify that you have completed your work for this session.</p>
              <p className="text-xs text-gray-400">This action will save your current working hours.</p>
            </div>
            
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2.5 flex-1 border border-[#2A2A2A] hover:bg-white/5 text-[#B3B3B3] hover:text-white rounded-xl text-sm font-semibold transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleClockOut}
                className="px-4 py-2.5 flex-1 bg-[#FF7A00] hover:bg-[#FF8C1A] disabled:bg-[#FF7A00]/50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-[#FF7A00]/20 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {submitting ? 'Clocking Out...' : 'Clock Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert */}
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

import { useState, useEffect, useCallback } from 'react';
import { Play, Square, AlertTriangle } from 'lucide-react';
import { timesheetService } from '../../services/timesheetService';
import { useAuth } from '../../context/AuthContext';

export default function ClockCard({ 
  onShiftLogged, 
  setToast, 
  isHoliday = false, 
  holidayName = '', 
  isWeekend = false, 
  settings = null,
  isOnLeave = false,
  leaveType = ''
}) {
  const { user } = useAuth();
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [activeLog, setActiveLog] = useState(null);
  const [timeStr, setTimeStr] = useState('00:00:00');
  const [dateStr, setDateStr] = useState('');
  const [notes, setNotes] = useState('');
  const [recoveryTime, setRecoveryTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [now, setNow] = useState(new Date());

  // Update now time every 10 seconds for recovery check
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const getRecoveryWindowCheck = () => {
    if (!isClockedIn) return false;
    if (!settings || !settings.attendance_recovery_enabled) return false;

    const [endHour, endMin] = settings.office_end_time.split(':').map(Number);
    const recoveryStartMin = endHour * 60 + endMin + 120; // 2 hours after office end time

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentMin = currentHour * 60 + currentMinute;

    return currentMin >= recoveryStartMin;
  };

  const isAfterRecoveryWindow = getRecoveryWindowCheck();

  const checkStatus = useCallback(async () => {
    if (!user) return;
    try {
      const res = await timesheetService.getActiveClockIn(user.id);
      if (res.hasActive) {
        setIsClockedIn(true);
        setActiveLog(res.log);
      } else {
        setIsClockedIn(false);
        setActiveLog(null);
      }
    } catch (err) {
      console.error("Error checking active session", err);
    }
  }, [user]);

  const handleOnlineSync = useCallback(async () => {
    setIsOnline(true);
    try {
      const res = await timesheetService.syncOfflineQueue();
      if (res && res.syncedCount > 0) {
        setToast({ message: `Successfully synced ${res.syncedCount} offline record(s) with server!`, type: 'success' });
        await checkStatus();
        if (onShiftLogged) onShiftLogged();
      }
    } catch (e) {
      console.error("Auto-sync error", e);
    }
  }, [checkStatus, onShiftLogged, setToast]);

  // Sync active status on mount and when user session changes
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Register online/offline event listeners
  useEffect(() => {
    const goOnline = () => {
      handleOnlineSync();
    };
    const goOffline = () => {
      setIsOnline(false);
      setToast({ message: 'Internet connection lost. Switched to offline mode.', type: 'warning' });
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    // Initial check on mount: sync if online
    if (navigator.onLine) {
      handleOnlineSync();
    }

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [handleOnlineSync, setToast]);

  // Update Ticker / Calendar text
  useEffect(() => {
    let interval = null;

    if (isClockedIn && activeLog) {
      // Calculate elapsed time since clockIn
      const startDateTime = new Date(`${activeLog.date}T${activeLog.clockIn}`);
      const updateTicker = () => {
        const elapsedMs = new Date() - startDateTime;
        if (elapsedMs < 0) {
          setTimeStr('00:00:00');
        } else {
          const hours = Math.floor(elapsedMs / 3600000);
          const minutes = Math.floor((elapsedMs % 3600000) / 60000);
          const seconds = Math.floor((elapsedMs % 60000) / 1000);
          setTimeStr(
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
          );
        }
      };
      updateTicker();
      interval = setInterval(updateTicker, 1000);
    } else {
      // Standard Live clock display
      const updateLiveTime = () => {
        const now = new Date();
        setTimeStr(
          now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          })
        );
        setDateStr(
          now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        );
      };
      updateLiveTime();
      interval = setInterval(updateLiveTime, 1000);
    }

    return () => clearInterval(interval);
  }, [isClockedIn, activeLog]);

  const handleClockIn = async () => {
    try {
      setSubmitting(true);
      await timesheetService.clockIn(user.id);
      setToast({ message: 'Successfully Clocked In!', type: 'success' });
      await checkStatus();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Failed to clock in.';
      setToast({ message: errMsg, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClockOut = async () => {
    if (!activeLog) return;
    try {
      setSubmitting(true);
      const res = await timesheetService.clockOut(activeLog.id, notes);
      setNotes('');
      setToast({ message: `Clocked Out. Hours Logged: ${res.log.hours}h`, type: 'success' });
      await checkStatus();
      if (onShiftLogged) onShiftLogged();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Failed to clock out.';
      setToast({ message: errMsg, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecoverySave = async () => {
    if (!recoveryTime) {
      setToast({ message: 'Please select your actual clock-out time.', type: 'error' });
      return;
    }

    // Validation: must be after Clock In
    if (activeLog && activeLog.clockIn) {
      const [inH, inM, inS = 0] = activeLog.clockIn.split(':').map(Number);
      const [outH, outM, outS = 0] = recoveryTime.split(':').map(Number);
      const inMin = inH * 60 + inM + inS / 60;
      const outMin = outH * 60 + outM + outS / 60;
      if (outMin <= inMin) {
        setToast({ message: 'Clock Out time must be later than Clock In time.', type: 'error' });
        return;
      }
    }

    // Validation: cannot be in the future relative to local browser time
    const nowLocal = new Date();
    const [outH, outM, outS = 0] = recoveryTime.split(':').map(Number);
    const selectedDateTime = new Date();
    selectedDateTime.setHours(outH, outM, outS, 0);
    if (selectedDateTime.getTime() > nowLocal.getTime()) {
      setToast({ message: 'Actual Clock Out Time cannot be in the future.', type: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      const res = await timesheetService.clockOut(activeLog.id, notes, recoveryTime);
      setNotes('');
      setRecoveryTime('');
      setToast({ message: `Attendance recovered successfully! Hours Logged: ${res.log.hours}h`, type: 'success' });
      await checkStatus();
      if (onShiftLogged) onShiftLogged();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.message || 'Failed to save attendance recovery.';
      setToast({ message: errMsg, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="bg-[#111111] border border-[#2A2A2A] p-10 flex flex-col items-center justify-center rounded-2xl relative overflow-hidden text-center shadow-2xl">
      {/* Background glow lines */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-[#FF7A00]"></div>
      
      <div className="relative z-10 mb-4">
        <div className="text-5xl font-extrabold tracking-tight text-[#FF7A00] font-mono">{timeStr}</div>
        <div className="text-sm text-[#B3B3B3] font-medium mt-2">
          {dateStr}
          {settings && (
            <span className="block text-[11px] text-[#FF7A00] font-bold mt-1.5 uppercase tracking-wider">
              Shift: {settings.office_start_time} - {settings.office_end_time}
            </span>
          )}
        </div>
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-[#2A2A2A] mb-8 relative z-10">
        <span className={`w-2.5 h-2.5 rounded-full ${isClockedIn ? 'bg-[#FF7A00] animate-pulse shadow-[0_0_10px_#FF7A00]' : 'bg-gray-600'}`}></span>
        <span className="text-[10px] font-bold text-white uppercase tracking-wider">
          {isClockedIn ? 'Clocked In' : 'Clocked Out'}
        </span>
        <span className="text-gray-600">|</span>
        <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-orange-500 animate-pulse'}`}></span>
        <span className="text-[10px] font-bold text-white uppercase tracking-wider">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      <div className="w-full max-w-md relative z-10">
        {isAfterRecoveryWindow ? (
          <div className="flex flex-col gap-4.5 text-left bg-orange-500/5 border border-orange-500/20 p-6 rounded-2xl animate-fade-in">
            <div className="flex items-center gap-2 text-[#FF7A00] font-black text-sm uppercase tracking-wider">
              <AlertTriangle size={18} />
              <span>Forgot to Clock Out</span>
            </div>
            <p className="text-gray-300 text-xs leading-relaxed font-medium">
              Our records show that you forgot to clock out today. Please enter your actual clock-out time.
            </p>
            
            <div className="flex flex-col gap-1.5 mt-2">
              <label htmlFor="recovery-time" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Actual Clock Out Time
              </label>
              <input
                id="recovery-time"
                type="time"
                step="1"
                required
                value={recoveryTime}
                onChange={(e) => setRecoveryTime(e.target.value)}
                className="bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl px-4 h-11 text-sm focus:outline-none focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="recovery-notes" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Reason (Optional)
              </label>
              <textarea
                id="recovery-notes"
                className="bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl p-3.5 text-sm focus:outline-none focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] transition resize-none w-full"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for missing clock out..."
                rows={2}
                maxLength={250}
              />
            </div>

            <button
              onClick={handleRecoverySave}
              disabled={submitting}
              className="w-full py-3.5 bg-[#FF7A00] hover:bg-[#FF8C1A] text-white text-sm font-bold rounded-xl transition duration-300 cursor-pointer shadow-lg shadow-[#FF7A00]/15 mt-1"
            >
              {submitting ? 'Saving...' : 'Save Recovery'}
            </button>
          </div>
        ) : (
          <>
            {isClockedIn && (
              <div className="mb-5 flex flex-col gap-2">
                <label htmlFor="shift-notes" className="text-left text-[10px] font-bold text-[#B3B3B3] uppercase tracking-wider">
                  What are you working on today?
                </label>
                <textarea
                  id="shift-notes"
                  name="notes"
                  className="bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl p-3.5 text-sm focus:outline-none focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] transition resize-none w-full"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What are you working on today?"
                  rows={2}
                  maxLength={250}
                />
              </div>
            )}

            <button
              onClick={isClockedIn ? () => setShowConfirm(true) : handleClockIn}
              disabled={submitting || isHoliday || isWeekend || isOnLeave}
              className={`w-full py-4 text-base font-bold rounded-xl flex items-center justify-center gap-2 transition duration-300 cursor-pointer disabled:cursor-not-allowed ${
                isHoliday || isWeekend || isOnLeave
                  ? 'bg-[#1A1A1A] text-gray-500 border border-[#2A2A2A] hover:shadow-none'
                  : isClockedIn
                    ? 'bg-[#2A2A2A] hover:bg-[#333333] text-white border border-[#3A3A3A] hover:shadow-[0_0_15px_rgba(255,122,0,0.1)]'
                    : 'bg-[#FF7A00] hover:bg-[#FF8C1A] text-white hover:shadow-[0_0_15px_rgba(255,122,0,0.35)] shadow-lg shadow-[#FF7A00]/10'
              }`}
            >
              {isClockedIn ? <Square size={16} /> : <Play size={16} />}
              <span>
                {submitting 
                  ? (isClockedIn ? 'Clocking Out...' : 'Clocking In...') 
                  : isHoliday
                    ? 'Holiday - Clock In Disabled'
                    : isWeekend
                      ? 'Weekend - Clock In Disabled'
                      : isOnLeave
                        ? 'On Approved Leave'
                        : (isClockedIn ? 'Clock Out' : 'Clock In')}
              </span>
            </button>
          </>
        )}
      </div>

      {/* Clock Out Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay backdrop */}
          <div 
            className="absolute inset-0 bg-black/85 backdrop-blur-sm animate-fade-in" 
            onClick={() => !submitting && setShowConfirm(false)}
          ></div>
          
          {/* Card panel */}
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
                className="px-4 py-2.5 flex-1 border border-[#2A2A2A] hover:bg-white/5 text-[#B3B3B3] hover:text-white rounded-xl text-sm font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={async () => {
                  await handleClockOut();
                  setShowConfirm(false);
                }}
                className="px-4 py-2.5 flex-1 bg-[#FF7A00] hover:bg-[#FF8C1A] disabled:bg-[#FF7A00]/50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-[#FF7A00]/20 transition cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {submitting ? 'Clocking Out...' : 'Clock Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

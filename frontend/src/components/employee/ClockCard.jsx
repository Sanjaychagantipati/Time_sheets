import React, { useState, useEffect, useCallback } from 'react';
import { Play, Square, MapPin } from 'lucide-react';
import { timesheetService } from '../../services/timesheetService';
import { useAuth } from '../../context/AuthContext';

export default function ClockCard({ onShiftLogged, setToast }) {
  const { user } = useAuth();
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [activeLog, setActiveLog] = useState(null);
  const [timeStr, setTimeStr] = useState('00:00:00');
  const [dateStr, setDateStr] = useState('');
  const [notes, setNotes] = useState('');
  const [locationStr, setLocationStr] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!user) return;
    try {
      const res = await timesheetService.getActiveClockIn(user.id);
      if (res.hasActive) {
        setIsClockedIn(true);
        setActiveLog(res.log);
        setLocationStr(res.log.location);
      } else {
        setIsClockedIn(false);
        setActiveLog(null);
        setLocationStr('');
      }
    } catch (err) {
      console.error("Error checking active session", err);
    }
  }, [user]);

  // Sync active status on mount and when user session changes
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

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
    setDetecting(true);
    let coordsText;
    const mockAddresses = [
      'HQ Boston, MA',
      'NYC Branch Office',
      'Remote - Co-working Space',
      'Home Office (Virtual VPN)',
      'Seattle Engineering Hub',
      'London Operations Branch'
    ];
    const randomMockAddress = mockAddresses[Math.floor(Math.random() * mockAddresses.length)];

    if ("geolocation" in navigator) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        coordsText = `Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)} (${randomMockAddress})`;
      } catch (err) {
        const lat = (42.3601 + (Math.random() - 0.5) * 0.05).toFixed(4);
        const lng = (-71.0589 + (Math.random() - 0.5) * 0.05).toFixed(4);
        coordsText = `Lat: ${lat}, Lng: ${lng} (${randomMockAddress} - Simulated)`;
      }
    } else {
      coordsText = `Simulated: ${randomMockAddress}`;
    }

    try {
      setSubmitting(true);
      const res = await timesheetService.clockIn(user.id, coordsText);
      setDetecting(false);
      setToast({ message: 'Successfully Clocked In!', type: 'success' });
      await checkStatus();
    } catch (err) {
      console.error(err);
      setDetecting(false);
      setToast({ message: 'Failed to clock in.', type: 'error' });
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
      setToast({ message: 'Failed to clock out.', type: 'error' });
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
        <div className="text-sm text-[#B3B3B3] font-medium mt-2">{dateStr}</div>
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-[#2A2A2A] mb-8 relative z-10">
        <span className={`w-2.5 h-2.5 rounded-full ${isClockedIn ? 'bg-[#FF7A00] animate-pulse shadow-[0_0_10px_#FF7A00]' : 'bg-gray-600'}`}></span>
        <span className="text-[10px] font-bold text-white uppercase tracking-wider">
          {isClockedIn ? 'Clocked In' : 'Clocked Out'}
        </span>
      </div>

      <div className="w-full max-w-md relative z-10">
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
            {locationStr && (
              <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-orange-500/5 border border-orange-500/10 text-[#FF7A00] text-xs mt-2">
                <MapPin size={12} />
                <span className="truncate max-w-[340px]" title={locationStr}>
                  {locationStr}
                </span>
              </div>
            )}
          </div>
        )}

        <button
          onClick={isClockedIn ? handleClockOut : handleClockIn}
          disabled={detecting || submitting}
          className={`w-full py-4 text-base font-bold rounded-xl flex items-center justify-center gap-2 transition duration-300 cursor-pointer disabled:cursor-not-allowed ${
            isClockedIn
              ? 'bg-[#2A2A2A] hover:bg-[#333333] text-white border border-[#3A3A3A] hover:shadow-[0_0_15px_rgba(255,122,0,0.1)]'
              : 'bg-[#FF7A00] hover:bg-[#FF8C1A] text-white hover:shadow-[0_0_15px_rgba(255,122,0,0.35)] shadow-lg shadow-[#FF7A00]/10'
          }`}
        >
          {isClockedIn ? <Square size={16} /> : <Play size={16} />}
          <span>
            {detecting 
              ? 'Detecting Location...' 
              : submitting 
                ? (isClockedIn ? 'Clocking Out...' : 'Clocking In...') 
                : (isClockedIn ? 'Clock Out' : 'Clock In')}
          </span>
        </button>
      </div>
    </div>
  );
}

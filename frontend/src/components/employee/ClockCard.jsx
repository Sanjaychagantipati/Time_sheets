import React, { useState, useEffect } from 'react';
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

  // Sync active status on mount and when user session changes
  useEffect(() => {
    if (!user) return;
    
    async function checkStatus() {
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
    }
    checkStatus();
  }, [user]);

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
    let coordsText = "Simulated Location";
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
      const res = await timesheetService.clockIn(user.id, coordsText);
      setIsClockedIn(true);
      setActiveLog(res.log);
      setLocationStr(coordsText);
      setDetecting(false);
      setToast({ message: 'Successfully Clocked In!', type: 'success' });
    } catch (err) {
      console.error(err);
      setDetecting(false);
      setToast({ message: 'Failed to clock in.', type: 'error' });
    }
  };

  const handleClockOut = async () => {
    if (!activeLog) return;
    try {
      const res = await timesheetService.clockOut(activeLog.id, notes);
      setIsClockedIn(false);
      setActiveLog(null);
      setNotes('');
      setLocationStr('');
      setToast({ message: `Clocked Out. Hours Logged: ${res.log.hours}h`, type: 'success' });
      if (onShiftLogged) onShiftLogged();
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to clock out.', type: 'error' });
    }
  };

  return (
    <div className="card glass hero-gradient p-10 flex flex-col items-center justify-center rounded-2xl relative overflow-hidden text-center bg-[#121826]/60 border border-white/5 shadow-xl">
      <div className="relative z-10 mb-4">
        <div className="text-5xl font-extrabold tracking-tight text-white font-mono">{timeStr}</div>
        <div className="text-sm text-gray-400 font-medium mt-2">{dateStr}</div>
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 relative z-10">
        <span className={`w-2 h-2 rounded-full ${isClockedIn ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]' : 'bg-gray-500'}`}></span>
        <span className="text-[10px] font-bold text-white uppercase tracking-wider">
          {isClockedIn ? 'Clocked In' : 'Clocked Out'}
        </span>
      </div>

      <div className="w-full max-w-md relative z-10">
        {isClockedIn && (
          <div className="mb-5 flex flex-col gap-2">
            <label className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              What are you working on? (Optional)
            </label>
            <textarea
              className="bg-[#1a2336] border border-white/5 text-white rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter task summary, notes, or milestones..."
              rows={2}
              maxLength={250}
            />
            {locationStr && (
              <div className="flex items-center justify-center gap-1.5 p-2 rounded bg-sky-500/5 border border-sky-500/10 text-sky-400 text-xs mt-2">
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
          disabled={detecting}
          className={`w-full py-4 text-base font-bold rounded-xl flex items-center justify-center gap-2 transition duration-200 ${
            isClockedIn
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20 shadow-lg'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20 shadow-lg'
          }`}
        >
          {isClockedIn ? <Square size={16} /> : <Play size={16} />}
          <span>{detecting ? 'Detecting Location...' : isClockedIn ? 'Clock Out' : 'Clock In'}</span>
        </button>
      </div>
    </div>
  );
}

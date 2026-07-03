import React from 'react';
import { formatTime12h } from '../../utils/formatters';

export default function AttendanceTimeline({ log }) {
  if (!log) return null;

  // Resolve sessions array, fallback to a single session from root log if no sessions exist
  const rawSessions = log.sessions && log.sessions.length > 0 ? log.sessions : [];
  
  const sessions = rawSessions.length > 0 
    ? rawSessions 
    : [
        {
          id: 'fallback',
          clockIn: log.clockIn,
          clockOut: log.clockOut,
          hours: log.hours
        }
      ];

  // Calculate summary fields
  const firstIn = log.clockIn ? formatTime12h(log.clockIn) : '--:--';
  const lastOut = log.clockOut ? formatTime12h(log.clockOut) : (log.status === 'ACTIVE' ? 'Active' : '--:--');
  const workedHours = log.hours !== null && log.hours !== undefined ? `${Number(log.hours).toFixed(2)} hrs` : 'Active';

  return (
    <div className="mt-4 pt-4 border-t border-[#2A2A2A] w-full text-left animate-fade-in">
      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-4">
        Attendance Session Timeline
      </div>

      <div className="flex flex-col gap-0.5 relative pl-6 border-l-2 border-[#2A2A2A] ml-2.5 pb-2">
        {sessions.map((session, index) => {
          const isLastSession = index === sessions.length - 1;
          const isActive = session.clockOut === null;

          return (
            <React.Fragment key={session.id || index}>
              {/* Clock In Point */}
              <div className="relative mb-4">
                {/* Timeline Connector Indicator Dot */}
                <span className="absolute -left-[31px] top-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-[#111111] border-2 border-green-500">
                  <span className="h-1 w-1 rounded-full bg-green-500 animate-pulse" />
                </span>
                
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-mono font-bold text-green-400">
                    {formatTime12h(session.clockIn)}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    Clock In
                  </span>
                </div>
              </div>

              {/* Clock Out Point */}
              <div className={`relative ${isLastSession ? '' : 'mb-4'}`}>
                {/* Timeline Connector Indicator Dot */}
                <span className={`absolute -left-[31px] top-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-[#111111] border-2 ${isActive ? 'border-orange-500' : 'border-rose-500'}`}>
                  <span className={`h-1 w-1 rounded-full ${isActive ? 'bg-orange-500 animate-ping' : 'bg-rose-500'}`} />
                </span>

                <div className="flex flex-col gap-0.5">
                  <span className={`text-xs font-mono font-bold ${isActive ? 'text-orange-400' : 'text-rose-400'}`}>
                    {isActive ? 'Active Shift...' : formatTime12h(session.clockOut)}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    {isActive ? 'In Progress' : 'Clock Out'}
                  </span>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Summary Box */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 mt-4 grid grid-cols-3 gap-2 text-center sm:text-left">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">First Login</span>
          <span className="text-xs font-mono font-bold text-white">{firstIn}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Last Logout</span>
          <span className="text-xs font-mono font-bold text-white">{lastOut}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Worked Hours</span>
          <span className="text-xs font-mono font-black text-[#FF7A00]">{workedHours}</span>
        </div>
      </div>
    </div>
  );
}

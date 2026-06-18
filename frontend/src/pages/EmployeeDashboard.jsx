import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { timesheetService } from '../services/timesheetService';
import ClockCard from '../components/employee/ClockCard';
import Toast from '../components/common/Toast';
import { Calendar, TrendingUp, ClipboardList, RotateCw, FolderOpen, MapPin, PlayCircle, StopCircle } from 'lucide-react';
import { formatDateFriendly, formatTime12h } from '../utils/formatters';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ today: 0, week: 0, total: 0 });
  const [toast, setToast] = useState(null);

  const fetchLogsAndCalculateStats = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const myLogs = await timesheetService.getMyLogs(user.id);
      setLogs(myLogs);

      const todayStr = new Date().toISOString().split('T')[0];

      // Calculate Hours Worked Today (Completed Shifts)
      const todayHours = myLogs
        .filter((t) => t.date === todayStr && t.clockOut !== null)
        .reduce((sum, current) => sum + (current.hours || 0), 0);

      // Calculate Hours Worked This Week (Sunday to Saturday)
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
      startOfWeek.setHours(0, 0, 0, 0);

      const weekHours = myLogs
        .filter((t) => {
          const logDate = new Date(t.date);
          return logDate >= startOfWeek && t.clockOut !== null;
        })
        .reduce((sum, current) => sum + (current.hours || 0), 0);

      setStats({
        today: parseFloat(todayHours.toFixed(2)),
        week: parseFloat(weekHours.toFixed(2)),
        total: myLogs.length,
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
    await fetchLogsAndCalculateStats();
    setToast({ message: 'Timesheet logs updated successfully.', type: 'success' });
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-white">
      {/* Upper Grid: Clock widget + Personal metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Clock-in Controller Widget */}
        <div className="lg:col-span-2">
          <ClockCard onShiftLogged={fetchLogsAndCalculateStats} setToast={setToast} />
        </div>

        {/* Metrics Grid */}
        <div className="flex flex-col gap-5 justify-between">
          
          {/* Today Stats */}
          <div className="p-6 bg-[#111111] border border-[#2A2A2A] rounded-xl flex items-center gap-5 flex-1 shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-[#FF7A00] flex items-center justify-center">
              <Calendar size={22} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#B3B3B3] uppercase tracking-wider">Hours Today</span>
              <span className="text-2xl font-bold text-white mt-1">{stats.today.toFixed(1)}h</span>
            </div>
          </div>

          {/* Weekly Stats */}
          <div className="p-6 bg-[#111111] border border-[#2A2A2A] rounded-xl flex items-center gap-5 flex-1 shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-[#FF7A00] flex items-center justify-center">
              <TrendingUp size={22} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#B3B3B3] uppercase tracking-wider">Hours This Week</span>
              <span className="text-2xl font-bold text-white mt-1">{stats.week.toFixed(1)}h</span>
            </div>
          </div>

          {/* Shift Count */}
          <div className="p-6 bg-[#111111] border border-[#2A2A2A] rounded-xl flex items-center gap-5 flex-1 shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-[#FF7A00] flex items-center justify-center">
              <ClipboardList size={22} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#B3B3B3] uppercase tracking-wider">Shifts Logged</span>
              <span className="text-2xl font-bold text-white mt-1">{stats.total}</span>
            </div>
          </div>

        </div>
      </div>

      {/* History table panel */}
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-5 border-b border-[#2A2A2A] flex items-center justify-between bg-black/20">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ClipboardList size={18} className="text-[#FF7A00]" />
            <span>My Work History</span>
          </h2>
          <button
            onClick={handleRefresh}
            className="p-2 border border-white/10 hover:border-[#FF7A00] hover:bg-[#FF7A00]/10 text-gray-400 hover:text-white rounded-lg transition duration-200 cursor-pointer"
            title="Refresh Logs"
            aria-label="Refresh Logs"
          >
            <RotateCw size={15} />
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-[#FF7A00] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-gray-400">Loading history logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center text-[#B3B3B3] gap-4">
            <FolderOpen size={48} className="text-gray-700 animate-pulse" />
            <p className="text-sm">No hours logged for you yet. Hit "Clock In" to begin!</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="sticky top-0 bg-[#111111] z-20">
                <tr className="border-b border-[#2A2A2A] bg-black/40 text-[#B3B3B3] uppercase text-[10px] tracking-wider font-bold">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Clock In</th>
                  <th className="px-6 py-4">Clock Out</th>
                  <th className="px-6 py-4">Total Hours</th>
                  <th className="px-6 py-4">Location Captured</th>
                  <th className="px-6 py-4">Work Notes</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Client</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A] text-[#B3B3B3]">
                {logs.map((log, index) => (
                  <tr key={log.id} className={`hover:bg-white/[0.02] transition duration-150 ${index % 2 === 0 ? 'bg-black/10' : ''}`}>
                    <td className="px-6 py-4 font-semibold text-white">{formatDateFriendly(log.date)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <PlayCircle size={14} className="text-[#FF7A00]" />
                        <span>{formatTime12h(log.clockIn)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <StopCircle size={14} className="text-gray-500" />
                        <span>
                          {log.clockOut ? (
                            formatTime12h(log.clockOut)
                          ) : (
                            <span className="text-[#FF7A00] animate-pulse font-semibold">Active Now</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-white">
                      {log.clockOut ? `${log.hours.toFixed(2)} hrs` : 'Active...'}
                    </td>
                    <td className="px-6 py-4 text-xs text-[#B3B3B3] max-w-[200px] truncate" title={log.location}>
                      <div className="flex items-center gap-1">
                        <MapPin size={12} className="text-[#FF7A00] shrink-0" />
                        <span>{log.location ? log.location.split(' (')[0] : 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-[#B3B3B3] max-w-[220px] truncate" title={log.notes}>
                      {log.notes || <span className="text-gray-600 italic">No notes</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full border ${
                        log.status === 'ACTIVE' 
                          ? 'bg-transparent text-white border-white/40 animate-pulse' 
                          : 'bg-orange-500/10 text-[#FF7A00] border-orange-500/20'
                      }`}>
                        {log.status === 'ACTIVE' ? 'Active' : 'Completed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#FF7A00]">{log.clientCompany || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

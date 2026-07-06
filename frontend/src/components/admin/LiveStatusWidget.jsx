import { useState, useEffect, useMemo } from 'react';
import { Play, Square, Users, AlertTriangle, Search, Filter, RotateCw } from 'lucide-react';
import { formatTime12h } from '../../utils/formatters';

// Sub-component to compute elapsed time dynamically
function LiveEmployeeRow({ log, isForgot }) {
  const [elapsed, setElapsed] = useState('0h 0m');

  useEffect(() => {
    const calculateElapsed = () => {
      if (!log.clockIn) return;
      const todayStr = new Date().toISOString().split('T')[0];
      const start = new Date(`${todayStr}T${log.clockIn}`);
      const diffMs = new Date() - start;
      if (diffMs < 0) {
        setElapsed('0h 0m');
      } else {
        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        setElapsed(`${hours}h ${minutes}m`);
      }
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 15000); // Ticks every 15 seconds
    return () => clearInterval(interval);
  }, [log]);

  return (
    <tr className="hover:bg-white/[0.02] border-b border-[#2A2A2A]/40 transition duration-150">
      <td className="px-6 py-4.5 font-bold text-white">{log.employeeName}</td>
      <td className="px-6 py-4.5 font-semibold text-[#FF7A00]">{log.clientCompany}</td>
      <td className="px-6 py-4.5 font-mono text-gray-300">{formatTime12h(log.clockIn)}</td>
      <td className="px-6 py-4.5 font-bold text-white font-mono">{elapsed}</td>
      <td className="px-6 py-4.5">
        <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full border ${
          isForgot 
            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
            : 'bg-green-500/10 text-green-400 border-green-500/20 animate-pulse'
        }`}>
          {isForgot ? '⚠ Forgot Clock Out' : '🟢 Currently Working'}
        </span>
      </td>
    </tr>
  );
}

export default function LiveStatusWidget({ employees, todayLogs, leaves = [], onRefresh }) {
  const [searchName, setSearchName] = useState('');
  const [searchClient, setSearchClient] = useState('all');
  const [searchStatus, setSearchStatus] = useState('all');
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await onRefresh();
    } finally {
      setLoading(false);
    }
  };

  // 1. Identify Forgot Clock Out Threshold
  const now = new Date();
  const isPastRecoveryThreshold = now.getHours() > 20 || (now.getHours() === 20 && now.getMinutes() >= 30);

  // 2. Compute memoized live stats and lists
  const {
    currentlyWorking,
    clockedOutLogs,
    notClockedInCount,
    onLeaveTodayUsers,
    forgotClockOut,
    uniqueClients,
    activeList
  } = useMemo(() => {
    const activeLogs = todayLogs.filter(log => log.clockOut === null);
    const clockedOutLogs = todayLogs.filter(log => log.clockOut !== null);

    const currentlyWorking = isPastRecoveryThreshold ? [] : activeLogs;
    const forgotClockOut = isPastRecoveryThreshold ? activeLogs : [];

    const todayStr = new Date().toISOString().split('T')[0];
    const onLeaveTodayUsers = leaves.filter(lf => {
      return lf.startDate <= todayStr && lf.endDate >= todayStr;
    });

    const notClockedInCount = employees.filter(
      emp => !todayLogs.some(log => log.userId === emp.id) &&
             !onLeaveTodayUsers.some(lf => lf.userId === emp.id)
    ).length;

    const uniqueClients = [...new Set(employees.map(emp => emp.clientCompany).filter(Boolean))].sort();

    const activeList = activeLogs.map(log => ({
      ...log,
      isForgot: isPastRecoveryThreshold
    }));

    return {
      currentlyWorking,
      clockedOutLogs,
      notClockedInCount,
      onLeaveTodayUsers,
      forgotClockOut,
      uniqueClients,
      activeList
    };
  }, [employees, todayLogs, leaves, isPastRecoveryThreshold]);

  // 3. Prepare filtered active list for display (memoized on filter inputs)
  const filteredActiveList = useMemo(() => {
    return activeList.filter(log => {
      const matchesName = log.employeeName.toLowerCase().includes(searchName.toLowerCase());
      const matchesClient = searchClient === 'all' || log.clientCompany === searchClient;
      const matchesStatus = searchStatus === 'all' || 
        (searchStatus === 'working' && !log.isForgot) || 
        (searchStatus === 'forgot' && log.isForgot);
      return matchesName && matchesClient && matchesStatus;
    });
  }, [activeList, searchName, searchClient, searchStatus]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
          <span>Live Employee Status Dashboard</span>
        </h3>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-1.5 border border-white/5 hover:border-[#FF7A00]/50 hover:bg-[#FF7A00]/10 text-gray-400 hover:text-white rounded-lg transition cursor-pointer"
          title="Refresh Live Data"
        >
          <RotateCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* 5 Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 animate-fade-in">
        
        {/* Currently Working */}
        <div className="bg-[#111111] border border-[#2A2A2A] p-4.5 rounded-2xl flex items-center gap-4 hover:border-green-500/30 transition duration-300">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center shrink-0">
            <Play size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Currently Working</span>
            <span className="text-xl font-bold text-white mt-0.5">{currentlyWorking.length}</span>
          </div>
        </div>

        {/* Clocked Out */}
        <div className="bg-[#111111] border border-[#2A2A2A] p-4.5 rounded-2xl flex items-center gap-4 hover:border-orange-500/30 transition duration-300">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#FF7A00] flex items-center justify-center shrink-0">
            <Square size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Clocked Out</span>
            <span className="text-xl font-bold text-white mt-0.5">{clockedOutLogs.length}</span>
          </div>
        </div>

        {/* Not Clocked In */}
        <div className="bg-[#111111] border border-[#2A2A2A] p-4.5 rounded-2xl flex items-center gap-4 hover:border-yellow-500/30 transition duration-300">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-400 flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Not Clocked In</span>
            <span className="text-xl font-bold text-white mt-0.5">{notClockedInCount}</span>
          </div>
        </div>

        {/* On Leave Today */}
        <div className="bg-[#111111] border border-[#2A2A2A] p-4.5 rounded-2xl flex items-center gap-4 hover:border-blue-500/30 transition duration-300">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">On Leave Today</span>
            <span className="text-xl font-bold text-white mt-0.5">{onLeaveTodayUsers.length}</span>
          </div>
        </div>

        {/* Forgot Clock Out */}
        <div className="bg-[#111111] border border-[#2A2A2A] p-4.5 rounded-2xl flex items-center gap-4 hover:border-rose-500/30 transition duration-300">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Forgot Clock Out</span>
            <span className="text-xl font-bold text-white mt-0.5">{forgotClockOut.length}</span>
          </div>
        </div>

      </div>

      {/* Live Employee List Table */}
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-[#2A2A2A] bg-black/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
            <span>Currently Active Shifts ({filteredActiveList.length})</span>
          </h4>
          
          {/* Live Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search candidate..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl pl-9 pr-4 h-9 text-xs focus:outline-none focus:border-[#FF7A00] transition w-44"
              />
            </div>

            {/* Client Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-2.5 h-9">
              <Filter size={12} className="text-gray-500" />
              <select
                value={searchClient}
                onChange={(e) => setSearchClient(e.target.value)}
                className="bg-transparent text-white text-xs focus:outline-none border-none pr-2 cursor-pointer"
              >
                <option value="all" className="bg-[#1A1A1A] text-white">All Clients</option>
                {uniqueClients.map(client => (
                  <option key={client} value={client} className="bg-[#1A1A1A] text-white">{client}</option>
                ))}
              </select>
            </div>

            {/* Status Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-2.5 h-9">
              <Filter size={12} className="text-gray-500" />
              <select
                value={searchStatus}
                onChange={(e) => setSearchStatus(e.target.value)}
                className="bg-transparent text-white text-xs focus:outline-none border-none pr-2 cursor-pointer"
              >
                <option value="all" className="bg-[#1A1A1A] text-white">All Statuses</option>
                <option value="working" className="bg-[#1A1A1A] text-white">Currently Working</option>
                <option value="forgot" className="bg-[#1A1A1A] text-white">Forgot Clock Out</option>
              </select>
            </div>
          </div>
        </div>

        {filteredActiveList.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-xs italic">
            No active employee records found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#2A2A2A] bg-black/20 text-gray-400 uppercase text-[9px] tracking-wider font-bold">
                  <th className="px-6 py-3.5">Candidate Name</th>
                  <th className="px-6 py-3.5">Client Company</th>
                  <th className="px-6 py-3.5">Clock In Time</th>
                  <th className="px-6 py-3.5">Working Duration</th>
                  <th className="px-6 py-3.5">Current Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]/40">
                {filteredActiveList.map(log => (
                  <LiveEmployeeRow key={log.id} log={log} isForgot={log.isForgot} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

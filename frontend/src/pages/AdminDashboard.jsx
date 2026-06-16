import React, { useState, useEffect, useCallback } from 'react';
import { timesheetService } from '../services/timesheetService';
import CreateEmployeeModal from '../components/admin/CreateEmployeeModal';
import EditLogModal from '../components/admin/EditLogModal';
import MonthlyDownloadModal from '../components/admin/MonthlyDownloadModal';
import Toast from '../components/common/Toast';
import {
  Users,
  UserCheck,
  Briefcase,
  UserPlus,
  CalendarPlus,
  Download,
  FileDown,
  SlidersHorizontal,
  FileSpreadsheet,
  Edit3,
  Trash2,
  MapPin,
  ClipboardX,
  Clock
} from 'lucide-react';
import { formatDateFriendly, formatTime12h } from '../utils/formatters';

// ChartJS setup
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function AdminDashboard() {
  const [stats, setStats] = useState({ active: 0, employees: 0, clients: 0, todaysHours: 0 });
  const [logs, setLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Filters
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [filterClient, setFilterClient] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Modals status
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState(null);

  // Bulk Selection State
  const [selectedTimesheets, setSelectedTimesheets] = useState([]);

  // Chart data
  const [chartData, setChartData] = useState({
    labels: ['Microsoft', 'Google', 'Meta', 'Amazon', 'Netflix'],
    datasets: [{ data: [0, 0, 0, 0, 0] }]
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch dashboard metadata
      const summary = await timesheetService.getAdminStats();
      setStats({
        active: summary.currentlyClockedIn,
        employees: summary.totalEmployees,
        clients: summary.activeClients,
        todaysHours: summary.todaysHours || 0
      });

      // Fetch placed candidates
      const list = await timesheetService.getEmployeesList();
      setEmployees(list);

      // Fetch filtered timesheets
      const filters = {
        userId: filterEmployee,
        client: filterClient,
        startDate: filterStartDate,
        endDate: filterEndDate
      };
      const timesheets = await timesheetService.getAdminTimesheets(filters);
      setLogs(timesheets);
      setSelectedTimesheets((prev) => prev.filter((id) => timesheets.some((t) => t.id === id)));

      // Calculate Client Weekly Billed Hours
      const clientHours = { Microsoft: 0, Google: 0, Meta: 0, Amazon: 0, Netflix: 0 };
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      timesheets.forEach((log) => {
        if (log.clockOut !== null && new Date(log.date) >= startOfWeek) {
          const client = log.clientCompany || 'Microsoft';
          if (clientHours[client] !== undefined) {
            clientHours[client] += log.hours || 0;
          }
        }
      });

      setChartData({
        labels: Object.keys(clientHours),
        datasets: [{
          label: 'Hours Billed (This Week)',
          data: Object.values(clientHours),
          backgroundColor: [
            'rgba(99, 102, 241, 0.75)',  // Indigo
            'rgba(16, 185, 129, 0.75)',  // Emerald
            'rgba(139, 92, 246, 0.75)',  // Purple
            'rgba(245, 158, 11, 0.75)',  // Amber
            'rgba(14, 165, 233, 0.75)'   // Sky
          ],
          borderColor: [
            '#6366f1',
            '#10b981',
            '#8b5cf6',
            '#f59e0b',
            '#0ea5e9'
          ],
          borderWidth: 1.5,
          borderRadius: 6
        }]
      });

    } catch (err) {
      console.error(err);
      setToast({ message: 'Error retrieving system records.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filterEmployee, filterClient, filterStartDate, filterEndDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleClearFilters = () => {
    setFilterEmployee('all');
    setFilterClient('all');
    setFilterStartDate('');
    setFilterEndDate('');
    setSelectedTimesheets([]);
    setToast({ message: 'Filters cleared', type: 'info' });
  };

  const handleExportMaster = async () => {
    try {
      await timesheetService.exportMasterCSV({
        userId: filterEmployee,
        client: filterClient,
        startDate: filterStartDate,
        endDate: filterEndDate
      });
      setToast({ message: 'Timesheets exported successfully!', type: 'success' });
    } catch (err) {
      setToast({ message: 'Master export failed.', type: 'error' });
    }
  };

  const handleDeleteLog = async (logId) => {
    if (confirm('Are you sure you want to permanently delete this timesheet entry?')) {
      try {
        await timesheetService.deleteLog(logId);
        setToast({ message: 'Timesheet record deleted', type: 'success' });
        loadData();
      } catch (err) {
        setToast({ message: 'Failed to delete record.', type: 'error' });
      }
    }
  };

  const handleEditClick = (logId) => {
    setSelectedLogId(logId);
    setIsEditOpen(true);
  };

  const handleAddManualClick = () => {
    setSelectedLogId(null);
    setIsEditOpen(true);
  };

  const toggleSelection = (id) => {
    setSelectedTimesheets((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (logs.length === 0) return;
    if (selectedTimesheets.length === logs.length) {
      setSelectedTimesheets([]);
    } else {
      setSelectedTimesheets(logs.map((log) => log.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTimesheets.length === 0) return;
    const count = selectedTimesheets.length;
    if (confirm(`Are you sure you want to permanently delete the ${count} selected timesheet entries?`)) {
      try {
        await timesheetService.deleteLogs(selectedTimesheets);
        setToast({ message: `${count} timesheet records deleted`, type: 'success' });
        setSelectedTimesheets([]);
        loadData();
      } catch (err) {
        setToast({ message: 'Failed to delete selected records.', type: 'error' });
      }
    }
  };

  // Chart styling options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        padding: 12,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        titleFont: { family: 'Outfit', size: 14, weight: 'bold' },
        bodyFont: { family: 'Outfit', size: 13 }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#9ca3af', font: { family: 'Outfit', size: 11 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#9ca3af', font: { family: 'Outfit', size: 12, weight: 'bold' } }
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-white">
      {/* 1. Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Employees */}
        <div className="card glass p-6 bg-[#121826]/40 border border-white/5 rounded-xl flex items-center gap-5">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <UserCheck size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Employees</span>
            <span className="text-2xl font-bold text-white mt-1">{stats.employees}</span>
          </div>
        </div>

        {/* Active Employees */}
        <div 
          onClick={() => {
            handleClearFilters();
            setToast({ message: 'Showing all logs for currently active shifts.', type: 'info' });
          }}
          className="card glass p-6 bg-[#121826]/40 border border-white/5 rounded-xl flex items-center gap-5 hover:border-indigo-500/50 cursor-pointer transition"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Users size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Employees</span>
            <span className="text-2xl font-bold text-white mt-1">{stats.active}</span>
          </div>
        </div>

        {/* Total Clients */}
        <div className="card glass p-6 bg-[#121826]/40 border border-white/5 rounded-xl flex items-center gap-5">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Briefcase size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Clients</span>
            <span className="text-2xl font-bold text-white mt-1">{stats.clients}</span>
          </div>
        </div>

        {/* Today's Hours */}
        <div className="card glass p-6 bg-[#121826]/40 border border-white/5 rounded-xl flex items-center gap-5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Clock size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Today's Hours</span>
            <span className="text-2xl font-bold text-white mt-1">{stats.todaysHours.toFixed(2)}</span>
          </div>
        </div>

      </div>

      {/* 2. Top Grid: Chart + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Weekly Chart */}
        <div className="lg:col-span-2 card glass p-6 bg-[#121826]/60 border border-white/5 rounded-2xl flex flex-col justify-between min-h-[340px]">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">Hours Billed by Client Company</h3>
          <div className="h-64 relative">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="card glass p-6 bg-[#121826]/60 border border-white/5 rounded-2xl flex flex-col justify-between">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">Quick Admin Actions</h3>
          <div className="grid grid-cols-2 gap-4 flex-grow items-center">
            
            <button 
              onClick={() => setIsCreateOpen(true)}
              className="h-24 p-4 rounded-xl border border-white/5 hover:border-indigo-500/50 bg-[#1a2336]/40 hover:bg-[#1a2336]/70 flex flex-col items-center justify-center gap-2 text-center transition"
            >
              <UserPlus size={20} className="text-indigo-400" />
              <span className="text-xs font-semibold">Create Candidate</span>
            </button>

            <button 
              onClick={handleAddManualClick}
              className="h-24 p-4 rounded-xl border border-white/5 hover:border-indigo-500/50 bg-[#1a2336]/40 hover:bg-[#1a2336]/70 flex flex-col items-center justify-center gap-2 text-center transition"
            >
              <CalendarPlus size={20} className="text-amber-400" />
              <span className="text-xs font-semibold">Add Manual Entry</span>
            </button>

            <button 
              onClick={handleExportMaster}
              className="h-24 p-4 rounded-xl border border-white/5 hover:border-indigo-500/50 bg-[#1a2336]/40 hover:bg-[#1a2336]/70 flex flex-col items-center justify-center gap-2 text-center transition"
            >
              <Download size={20} className="text-emerald-400" />
              <span className="text-xs font-semibold">Export Master CSV</span>
            </button>

            <button 
              onClick={() => setIsDownloadOpen(true)}
              className="h-24 p-4 rounded-xl border border-white/5 hover:border-indigo-500/50 bg-[#1a2336]/40 hover:bg-[#1a2336]/70 flex flex-col items-center justify-center gap-2 text-center transition"
            >
              <FileDown size={20} className="text-purple-400" />
              <span className="text-xs font-semibold">Monthly Export</span>
            </button>

          </div>
        </div>

      </div>

      {/* 3. Filter control panel */}
      <div className="card glass p-6 bg-[#121826]/60 border border-white/5 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold flex items-center gap-2 text-gray-300">
            <SlidersHorizontal size={14} className="text-indigo-400" />
            <span>Filter & Search Records</span>
          </h3>
          <button onClick={handleClearFilters} className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold hover:underline">
            Clear Filters
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="flex flex-col gap-1.5">
            <label htmlFor="filter-candidate" className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Candidate</label>
            <select
              id="filter-candidate"
              name="filterEmployee"
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              className="bg-[#1a2336] border border-white/5 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="all">All Candidates</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} (Placed: {emp.clientCompany})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="filter-client" className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Client Company</label>
            <select
              id="filter-client"
              name="filterClient"
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="bg-[#1a2336] border border-white/5 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="all">All Client MNCs</option>
              <option value="Microsoft">Microsoft</option>
              <option value="Google">Google</option>
              <option value="Meta">Meta</option>
              <option value="Amazon">Amazon</option>
              <option value="Netflix">Netflix</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="filter-start-date" className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Start Date</label>
            <input
              id="filter-start-date"
              name="filterStartDate"
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="bg-[#1a2336] border border-white/5 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="filter-end-date" className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">End Date</label>
            <input
              id="filter-end-date"
              name="filterEndDate"
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="bg-[#1a2336] border border-white/5 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

        </div>
      </div>

      {/* 4. Master Timesheet Listing Table */}
      <div className="card glass bg-[#121826]/60 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-indigo-400" />
            <span>Master Timesheets</span>
          </h2>
          <div className="flex items-center gap-3">
            {selectedTimesheets.length > 0 && (
              <span className="text-xs text-gray-400 font-semibold">
                {selectedTimesheets.length} selected
              </span>
            )}
            <button
              onClick={handleBulkDelete}
              disabled={selectedTimesheets.length === 0}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition duration-200 cursor-pointer disabled:cursor-not-allowed ${
                selectedTimesheets.length === 0
                  ? 'border-white/5 bg-[#1a2336]/20 text-gray-500'
                  : 'border-rose-500/20 bg-rose-500/10 text-rose-400 hover:border-rose-500 hover:text-white hover:bg-rose-500 shadow-lg shadow-rose-500/10'
              }`}
            >
              Delete Selected
            </button>
            <span className="px-2.5 py-1 text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
              {logs.length} entries
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-gray-400">Loading master records...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center text-gray-400 gap-4">
            <ClipboardX size={48} className="text-gray-600 animate-pulse" />
            <p className="text-sm">No timesheet records match your filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-gray-400 uppercase text-[10px] tracking-wider font-bold">
                  <th className="px-6 py-4 w-12">
                    <input
                      type="checkbox"
                      checked={logs.length > 0 && selectedTimesheets.length === logs.length}
                      onChange={toggleSelectAll}
                      className="rounded border-white/10 bg-[#1a2336] text-indigo-500 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4">Candidate</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Clock In</th>
                  <th className="px-6 py-4">Clock Out</th>
                  <th className="px-6 py-4">Total Hours</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Notes</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {logs.map((log) => {
                  const candidate = employees.find((u) => u.id === log.userId) || { name: 'Unknown Candidate' };
                  return (
                    <tr key={log.id} className={`hover:bg-white/[0.02] transition duration-150 ${selectedTimesheets.includes(log.id) ? 'bg-white/[0.01]' : ''}`}>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedTimesheets.includes(log.id)}
                          onChange={() => toggleSelection(log.id)}
                          className="rounded border-white/10 bg-[#1a2336] text-indigo-500 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-white">{candidate.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-indigo-400">{log.clientCompany || 'N/A'}</td>
                      <td className="px-6 py-4 font-semibold">{formatDateFriendly(log.date)}</td>
                      <td className="px-6 py-4">{formatTime12h(log.clockIn)}</td>
                      <td className="px-6 py-4">
                        {log.clockOut ? (
                          formatTime12h(log.clockOut)
                        ) : (
                          <span className="text-indigo-400 animate-pulse font-semibold">Active...</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-white">
                        {log.clockOut ? `${log.hours.toFixed(2)} hrs` : 'In Progress'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full border ${
                          log.status === 'ACTIVE' 
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse' 
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {log.status === 'ACTIVE' ? 'Active' : 'Completed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400 max-w-[200px] truncate" title={log.notes}>
                        {log.notes || <span className="text-gray-600 italic">none</span>}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400 max-w-[180px] truncate" title={log.location}>
                        <div className="flex items-center gap-1">
                          <MapPin size={11} className="text-sky-400 shrink-0" />
                          <span>{log.location ? log.location.split(' (')[0] : 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => handleEditClick(log.id)}
                            className="p-1.5 border border-white/10 hover:border-gray-500 text-gray-400 hover:text-white rounded-lg transition"
                            title="Edit Log"
                            aria-label="Edit"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="p-1.5 border border-rose-500/20 hover:border-rose-500 text-rose-400 hover:text-white hover:bg-rose-500/10 rounded-lg transition"
                            title="Delete Log"
                            aria-label="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Staffing Candidates Directory (View Only) */}
      <div className="card glass bg-[#121826]/60 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Users size={18} className="text-indigo-400" />
            <span>Staffing Candidates Directory (View Only)</span>
          </h2>
          <span className="px-2.5 py-1 text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
            {employees.length} candidates
          </span>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02] text-gray-400 uppercase text-[10px] tracking-wider font-bold">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Client Company</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {employees.map((emp) => {
                const isCurrentlyClockedIn = logs.some(log => log.userId === emp.id && log.clockOut === null);
                return (
                  <tr key={emp.id} className="hover:bg-white/[0.02] transition duration-150">
                    <td className="px-6 py-4 font-bold text-white">{emp.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">{emp.username}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-[#1a2336] text-indigo-300 rounded border border-white/5 uppercase">
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-indigo-400">{emp.clientCompany || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full border ${
                        isCurrentlyClockedIn 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse' 
                          : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      }`}>
                        {isCurrentlyClockedIn ? 'Clocked In' : 'Off Duty'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals Hooks */}
      <CreateEmployeeModal 
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={loadData}
        setToast={setToast}
      />

      <EditLogModal 
        isOpen={isEditOpen}
        logId={selectedLogId}
        onClose={() => setIsEditOpen(false)}
        onSuccess={loadData}
        setToast={setToast}
      />

      <MonthlyDownloadModal 
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        setToast={setToast}
      />

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

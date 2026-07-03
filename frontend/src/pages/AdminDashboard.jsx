import React, { useState, useEffect, useCallback } from 'react';
import { timesheetService } from '../services/timesheetService';
import CreateEmployeeModal from '../components/admin/CreateEmployeeModal';
import EditLogModal from '../components/admin/EditLogModal';
import MonthlyDownloadModal from '../components/admin/MonthlyDownloadModal';
import HolidayManagementModal from '../components/admin/HolidayManagementModal';
import Toast from '../components/common/Toast';
import {
  Users,
  UserCheck,
  Briefcase,
  UserPlus,
  Calendar,
  CalendarPlus,
  Download,
  FileDown,
  SlidersHorizontal,
  FileSpreadsheet,
  Edit3,
  Trash2,
  ClipboardX,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatDateFriendly, formatTime12h } from '../utils/formatters';
import { useClientCompanies } from '../context/ClientCompanyContext';
import CreateCompanyModal from '../components/admin/CreateCompanyModal';
import AttendanceTimeline from '../components/common/AttendanceTimeline';


export default function AdminDashboard() {
  const [stats, setStats] = useState({ active: 0, employees: 0, clients: 0, timesheetsSubmittedToday: 0 });
  const [logs, setLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Filters
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [filterClient, setFilterClient] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const { companies } = useClientCompanies();

  // Modals status
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isCompanyOpen, setIsCompanyOpen] = useState(false);
  const [isHolidayOpen, setIsHolidayOpen] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState(null);

  // Bulk Selection State
  const [selectedTimesheets, setSelectedTimesheets] = useState([]);
  const [expandedTimesheetIds, setExpandedTimesheetIds] = useState([]);

  const toggleTimesheetExpand = (id) => {
    setExpandedTimesheetIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };


  const loadData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);

      // Fetch dashboard metadata
      const summary = await timesheetService.getAdminStats();
      setStats({
        active: summary.currentlyClockedIn,
        employees: summary.totalEmployees,
        clients: summary.activeClients,
        timesheetsSubmittedToday: summary.timesheetsSubmittedToday || 0
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

      // No chart updates needed

    } catch (err) {
      console.error(err);
      setToast({ message: 'Error retrieving system records.', type: 'error' });
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [filterEmployee, filterClient, filterStartDate, filterEndDate]);

  const refreshEmployees = useCallback(async () => {
    try {
      const list = await timesheetService.getEmployeesList();
      setEmployees(list);
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to refresh candidate list.', type: 'error' });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'vt_timesheets' || e.key === 'vt_users' || e.key === 'vt_sync_trigger') {
        loadData(true);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadData(true);
    }, 5000);
    return () => clearInterval(interval);
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
    } catch {
      setToast({ message: 'Master export failed.', type: 'error' });
    }
  };

  const handleDeleteLog = async (logId) => {
    if (confirm('Are you sure you want to permanently delete this timesheet entry?')) {
      try {
        await timesheetService.deleteLog(logId);
        setToast({ message: 'Timesheet record deleted', type: 'success' });
        loadData();
      } catch {
        setToast({ message: 'Failed to delete record.', type: 'error' });
      }
    }
  };

  const handleDeleteEmployee = async (userId, name) => {
    if (confirm('Delete this employee account?')) {
      try {
        await timesheetService.deleteEmployee(userId);
        setToast({ message: `Candidate account for ${name} removed`, type: 'success' });
        loadData();
      } catch (err) {
        console.error(err);
        setToast({ message: 'Failed to delete employee.', type: 'error' });
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
    if (confirm(`Delete ${count} selected timesheets?`)) {
      try {
        await timesheetService.deleteLogs(selectedTimesheets);
        setToast({ message: `${count} timesheet records deleted`, type: 'success' });
        setSelectedTimesheets([]);
        loadData();
      } catch {
        setToast({ message: 'Failed to delete selected records.', type: 'error' });
      }
    }
  };

  // Extract unique client company list for filter from context only
  const uniqueClients = [...companies].sort();

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-white">
      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:justify-between md:items-center border-b border-[#2A2A2A] pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Manager Overview</h1>
          <p className="text-xs text-[#B3B3B3] mt-1">Track placed candidate shifts, client MNCs, and monthly billing reports.</p>
        </div>
        <div className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider py-1 px-3 bg-white/5 rounded-full border border-white/5 w-fit">
          System Admin Portal
        </div>
      </div>

      {/* 1. Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Employees */}
        <div className="bg-[#111111] border border-[#2A2A2A] p-6 rounded-2xl flex items-center gap-5 hover:border-[#FF7A00]/40 transition duration-300 hover:shadow-lg hover:shadow-[#FF7A00]/5 hover:-translate-y-0.5">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-[#FF7A00] flex items-center justify-center shrink-0">
            <UserCheck size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-[#B3B3B3] uppercase tracking-wider">Total Employees</span>
            <span className="text-2xl font-bold text-white mt-1">{employees.length}</span>
          </div>
        </div>

        {/* Active Employees */}
        <div 
          onClick={() => {
            handleClearFilters();
            setToast({ message: 'Showing all logs for currently active shifts.', type: 'info' });
          }}
          className="bg-[#111111] border border-[#2A2A2A] p-6 rounded-2xl flex items-center gap-5 hover:border-[#FF7A00] cursor-pointer transition duration-300 hover:shadow-lg hover:shadow-[#FF7A00]/5 hover:-translate-y-0.5"
        >
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-[#FF7A00] flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-[#B3B3B3] uppercase tracking-wider">Active Employees</span>
            <span className="text-2xl font-bold text-white mt-1">{stats.active}</span>
          </div>
        </div>

        {/* Total Clients */}
        <div className="bg-[#111111] border border-[#2A2A2A] p-6 rounded-2xl flex items-center gap-5 hover:border-[#FF7A00]/40 transition duration-300 hover:shadow-lg hover:shadow-[#FF7A00]/5 hover:-translate-y-0.5">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-[#FF7A00] flex items-center justify-center shrink-0">
            <Briefcase size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-[#B3B3B3] uppercase tracking-wider">Total Clients</span>
            <span className="text-2xl font-bold text-white mt-1">{companies.length}</span>
          </div>
        </div>

        {/* Timesheets Submitted Today */}
        <div className="bg-[#111111] border border-[#2A2A2A] p-6 rounded-2xl flex items-center gap-5 hover:border-[#FF7A00]/40 transition duration-300 hover:shadow-lg hover:shadow-[#FF7A00]/5 hover:-translate-y-0.5">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-[#FF7A00] flex items-center justify-center shrink-0">
            <FileSpreadsheet size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-[#B3B3B3] uppercase tracking-wider">Timesheets Submitted Today</span>
            <span className="text-2xl font-bold text-white mt-1">{stats.timesheetsSubmittedToday}</span>
          </div>
        </div>

      </div>

      {/* 2. Quick Admin Actions Grid */}
      <div className="bg-[#111111] border border-[#2A2A2A] p-6 rounded-2xl shadow-xl">
        <h3 className="text-sm font-bold text-[#B3B3B3] uppercase tracking-wider mb-4">Quick Admin Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="h-24 p-4 rounded-2xl border border-[#2A2A2A] hover:border-[#FF7A00]/60 bg-[#1A1A1A] hover:bg-[#1A1A1A]/80 flex flex-col items-center justify-center gap-2 text-center transition-all duration-300 hover:shadow-lg hover:shadow-[#FF7A00]/5 hover:-translate-y-0.5 cursor-pointer"
          >
            <UserPlus size={20} className="text-[#FF7A00]" />
            <span className="text-xs font-semibold text-white">Create Candidate</span>
          </button>

          <button 
            onClick={handleAddManualClick}
            className="h-24 p-4 rounded-2xl border border-[#2A2A2A] hover:border-[#FF7A00]/60 bg-[#1A1A1A] hover:bg-[#1A1A1A]/80 flex flex-col items-center justify-center gap-2 text-center transition-all duration-300 hover:shadow-lg hover:shadow-[#FF7A00]/5 hover:-translate-y-0.5 cursor-pointer"
          >
            <CalendarPlus size={20} className="text-[#FF7A00]" />
            <span className="text-xs font-semibold text-white">Add Manual Entry</span>
          </button>

          <button 
            onClick={() => setIsCompanyOpen(true)}
            className="h-24 p-4 rounded-2xl border border-[#2A2A2A] hover:border-[#FF7A00]/60 bg-[#1A1A1A] hover:bg-[#1A1A1A]/80 flex flex-col items-center justify-center gap-2 text-center transition-all duration-300 hover:shadow-lg hover:shadow-[#FF7A00]/5 hover:-translate-y-0.5 cursor-pointer"
          >
            <Briefcase size={20} className="text-[#FF7A00]" />
            <span className="text-xs font-semibold text-white">Create Client Company</span>
          </button>

          <button 
            onClick={handleExportMaster}
            className="h-24 p-4 rounded-2xl border border-[#2A2A2A] hover:border-[#FF7A00]/60 bg-[#1A1A1A] hover:bg-[#1A1A1A]/80 flex flex-col items-center justify-center gap-2 text-center transition-all duration-300 hover:shadow-lg hover:shadow-[#FF7A00]/5 hover:-translate-y-0.5 cursor-pointer"
          >
            <Download size={20} className="text-[#FF7A00]" />
            <span className="text-xs font-semibold text-white">Export Master CSV</span>
          </button>

          <button 
            onClick={() => setIsDownloadOpen(true)}
            className="h-24 p-4 rounded-2xl border border-[#2A2A2A] hover:border-[#FF7A00]/60 bg-[#1A1A1A] hover:bg-[#1A1A1A]/80 flex flex-col items-center justify-center gap-2 text-center transition-all duration-300 hover:shadow-lg hover:shadow-[#FF7A00]/5 hover:-translate-y-0.5 cursor-pointer"
          >
            <FileDown size={20} className="text-[#FF7A00]" />
            <span className="text-xs font-semibold text-white">Monthly Attendance Report</span>
          </button>

          <button 
            onClick={() => setIsHolidayOpen(true)}
            className="h-24 p-4 rounded-2xl border border-[#2A2A2A] hover:border-[#FF7A00]/60 bg-[#1A1A1A] hover:bg-[#1A1A1A]/80 flex flex-col items-center justify-center gap-2 text-center transition-all duration-300 hover:shadow-lg hover:shadow-[#FF7A00]/5 hover:-translate-y-0.5 cursor-pointer"
          >
            <Calendar size={20} className="text-[#FF7A00]" />
            <span className="text-xs font-semibold text-white">Holiday Management</span>
          </button>

        </div>
      </div>

      {/* 3. Filter control panel */}
      <div className="bg-[#111111] border border-[#2A2A2A] p-6 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-[#B3B3B3]">
            <SlidersHorizontal size={14} className="text-[#FF7A00]" />
            <span>Filter & Search Records</span>
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="flex flex-col gap-1.5">
            <label htmlFor="filter-candidate" className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Candidate</label>
            <select
              id="filter-candidate"
              name="filterEmployee"
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              className="h-11 bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl px-3 text-xs focus:outline-none focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] transition cursor-pointer"
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
            <label htmlFor="filter-client" className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Client Company</label>
            <select
              id="filter-client"
              name="filterClient"
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="h-11 bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl px-3 text-xs focus:outline-none focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] transition cursor-pointer"
            >
              <option value="all">All Client MNCs</option>
              {uniqueClients.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="filter-start-date" className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Start Date</label>
            <input
              id="filter-start-date"
              name="filterStartDate"
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="h-11 bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl px-3 text-xs focus:outline-none focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] transition cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="filter-end-date" className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">End Date</label>
            <input
              id="filter-end-date"
              name="filterEndDate"
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="h-11 bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl px-3 text-xs focus:outline-none focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] transition cursor-pointer"
            />
          </div>

        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={handleClearFilters}
            className="h-10 px-5 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-[#B3B3B3] hover:text-white border border-[#2A2A2A] rounded-xl text-xs font-bold transition duration-200 cursor-pointer"
          >
            Reset Filters
          </button>
          <button
            onClick={loadData}
            className="h-10 px-5 bg-[#FF7A00] hover:bg-[#FF8C1A] text-white rounded-xl text-xs font-bold transition duration-200 cursor-pointer shadow-md shadow-[#FF7A00]/10 hover:shadow-lg hover:shadow-[#FF7A00]/20"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* 4. Master Timesheet Listing Table */}
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-5 border-b border-[#2A2A2A] flex items-center justify-between bg-black/20">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-[#FF7A00]" />
            <span>Master Timesheets</span>
          </h2>
          <div className="flex items-center gap-3">
            {selectedTimesheets.length > 0 && (
              <span className="text-xs text-[#FF7A00] font-bold">
                {selectedTimesheets.length} selected
              </span>
            )}
            <button
              onClick={handleBulkDelete}
              disabled={selectedTimesheets.length === 0}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all duration-200 cursor-pointer disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] ${
                selectedTimesheets.length === 0
                  ? 'border-white/5 bg-[#2A2A2A]/20 text-gray-500'
                  : 'bg-[#FF7A00] hover:bg-[#FF8C1A] border-transparent text-white shadow-md shadow-[#FF7A00]/10 hover:shadow-[#FF7A00]/20'
              }`}
            >
              Delete Selected
            </button>
            <span className="px-2.5 py-1 text-xs font-bold bg-orange-500/10 text-[#FF7A00] border border-orange-500/20 rounded-full animate-fade-in">
              {logs.length} entries
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-[#FF7A00] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-gray-400">Loading master records...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center text-[#B3B3B3] gap-4">
            <ClipboardX size={48} className="text-gray-700 animate-pulse" />
            <p className="text-sm">No timesheet records match your filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="sticky top-0 bg-[#111111]/90 backdrop-blur-md z-20">
                <tr className="border-b border-[#2A2A2A] bg-black/40 text-[#B3B3B3] uppercase text-[10px] tracking-wider font-bold">
                  <th className="px-6 py-4 w-12">
                    <input
                      type="checkbox"
                      checked={logs.length > 0 && selectedTimesheets.length === logs.length}
                      onChange={toggleSelectAll}
                      className="rounded border-[#2A2A2A] bg-[#1A1A1A] text-[#FF7A00] focus:ring-[#FF7A00] focus:ring-offset-0 w-4 h-4 cursor-pointer accent-[#FF7A00] transition duration-200"
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
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A] text-[#B3B3B3]">
                {logs.map((log, index) => {
                  const candidate = employees.find((u) => u.id === log.userId) || { name: 'Unknown Candidate' };
                  const isSelected = selectedTimesheets.includes(log.id);
                  const isExpanded = expandedTimesheetIds.includes(log.id);
                  return (
                    <React.Fragment key={log.id}>
                      <tr className={`hover:bg-white/[0.02] transition duration-150 ${isSelected ? 'bg-white/[0.01]' : ''} ${index % 2 === 0 ? 'bg-black/10' : ''}`}>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelection(log.id)}
                            className="rounded border-[#2A2A2A] bg-[#1A1A1A] text-[#FF7A00] focus:ring-[#FF7A00] focus:ring-offset-0 w-4 h-4 cursor-pointer accent-[#FF7A00] transition duration-200"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleTimesheetExpand(log.id)}
                              className="p-1 border border-white/5 hover:border-[#FF7A00]/50 hover:bg-[#FF7A00]/10 text-gray-500 hover:text-white rounded-lg transition cursor-pointer"
                              title="Toggle Session Timeline"
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            <span className="font-bold text-white">{candidate.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-[#FF7A00]">{log.clientCompany || 'N/A'}</td>
                        <td className="px-6 py-4 font-semibold">{formatDateFriendly(log.date)}</td>
                        <td className="px-6 py-4">{formatTime12h(log.clockIn)}</td>
                        <td className="px-6 py-4">
                          {log.clockOut ? (
                            formatTime12h(log.clockOut)
                          ) : (
                            <span className="text-[#FF7A00] animate-pulse font-semibold">Active...</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-bold text-white">
                          {log.clockOut ? `${log.hours.toFixed(2)} hrs` : 'In Progress'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full border ${
                            log.status === 'ACTIVE' 
                              ? 'bg-green-500/10 text-green-400 border-green-500/20 animate-pulse' 
                              : 'bg-orange-500/10 text-[#FF7A00] border-orange-500/20'
                          }`}>
                            {log.status === 'ACTIVE' ? 'Active' : 'Completed'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-[#B3B3B3] max-w-[200px] truncate" title={log.notes}>
                          {log.notes || <span className="text-gray-600 italic">none</span>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => handleEditClick(log.id)}
                              className="p-1.5 border border-white/10 hover:border-[#FF7A00] hover:bg-[#FF7A00]/10 text-gray-400 hover:text-[#FF7A00] rounded-xl transition cursor-pointer active:scale-95 duration-200"
                              title="Edit Log"
                              aria-label="Edit"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteLog(log.id)}
                              className="p-1.5 border border-rose-500/20 hover:border-rose-500 hover:bg-rose-500/10 text-rose-400 hover:text-white rounded-xl transition cursor-pointer active:scale-95 duration-200"
                              title="Delete Log"
                              aria-label="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-black/30">
                          <td colSpan={10} className="px-10 py-6 border-b border-[#2A2A2A]">
                            <div className="max-w-4xl mx-auto">
                              <AttendanceTimeline log={log} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Staffing Candidates Directory */}
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-5 border-b border-[#2A2A2A] flex items-center justify-between bg-black/20">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Users size={18} className="text-[#FF7A00]" />
            <span>Staffing Candidates Directory</span>
          </h2>
          <span className="px-2.5 py-1 text-xs font-bold bg-orange-500/10 text-[#FF7A00] border border-orange-500/20 rounded-full">
            {employees.length} candidates
          </span>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="sticky top-0 bg-[#111111]/90 backdrop-blur-md z-20">
              <tr className="border-b border-[#2A2A2A] bg-black/40 text-[#B3B3B3] uppercase text-[10px] tracking-wider font-bold">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Client Company</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A] text-[#B3B3B3]">
              {employees.map((emp, index) => {
                const isCurrentlyClockedIn = logs.some(log => log.userId === emp.id && log.clockOut === null);
                return (
                  <tr key={emp.id} className={`hover:bg-white/[0.02] transition duration-150 ${index % 2 === 0 ? 'bg-black/10' : ''}`}>
                    <td className="px-6 py-4 font-bold text-white">{emp.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-[#B3B3B3]">{emp.username}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-lg border uppercase tracking-wider ${
                        emp.role.toLowerCase() === 'admin'
                          ? 'bg-orange-500/10 text-[#FF7A00] border-orange-500/20'
                          : 'bg-white/5 text-white border-white/10'
                      }`}>
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#FF7A00]">{emp.clientCompany || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full border ${
                        isCurrentlyClockedIn 
                          ? 'bg-green-500/10 text-green-400 border-green-500/20 animate-pulse' 
                          : 'bg-transparent text-gray-500 border border-[#2A2A2A]'
                      }`}>
                        {isCurrentlyClockedIn ? 'Clocked In' : 'Off Duty'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                        className="p-1.5 border border-rose-500/20 hover:border-rose-500 hover:bg-rose-500/10 text-rose-400 hover:text-white rounded-xl transition cursor-pointer active:scale-95 duration-200"
                        title="Delete Employee"
                        aria-label={`Delete ${emp.name}`}
                      >
                        <Trash2 size={13} />
                      </button>
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
        onSuccess={refreshEmployees}
        setToast={setToast}
        onCreateCompanyClick={() => {
          setIsCreateOpen(false);
          setIsCompanyOpen(true);
        }}
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

      <CreateCompanyModal 
        isOpen={isCompanyOpen}
        onClose={() => setIsCompanyOpen(false)}
        employees={employees}
        setToast={setToast}
      />

      <HolidayManagementModal
        isOpen={isHolidayOpen}
        onClose={() => setIsHolidayOpen(false)}
        setToast={setToast}
      />

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

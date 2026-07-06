import { useState, useEffect, useCallback } from 'react';
import { Calendar, Search, SlidersHorizontal, Plus, Edit3, Trash2, ShieldAlert, RotateCw, CheckCircle, RefreshCw, X, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import Toast from '../components/common/Toast';

export default function LeaveManagement() {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Search History Filters
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [userId, setUserId] = useState('');
  const [leaveType, setLeaveType] = useState('Casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Search History Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClient, setFilterClient] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [hasSearched, setHasSearched] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [leavesRes, employeesRes] = await Promise.all([
        api.get('/admin/leaves'),
        api.get('/admin/employees'),
      ]);
      setLeaves(leavesRes.data || []);
      setEmployees(employeesRes.data || []);
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to load leaves data.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Helper date calculation
  const getTodayDateOnly = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const getLeaveDays = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e - s);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const getDaysRemaining = (start) => {
    const s = new Date(start);
    s.setHours(0, 0, 0, 0);
    const today = getTodayDateOnly();
    const diffTime = s - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getLeaveStatus = (lf, todayVal) => {
    const s = new Date(lf.startDate);
    const e = new Date(lf.endDate);
    s.setHours(0, 0, 0, 0);
    e.setHours(23, 59, 59, 999);
    if (s > todayVal) return 'Upcoming';
    if (s <= todayVal && e >= todayVal) return 'Current';
    return 'Completed';
  };

  // Group leaves dynamically based on current date
  const today = getTodayDateOnly();
  const currentLeaves = leaves.filter((lf) => {
    const s = new Date(lf.startDate);
    const e = new Date(lf.endDate);
    s.setHours(0, 0, 0, 0);
    e.setHours(23, 59, 59, 999);
    return s <= today && e >= today;
  });

  const upcomingLeaves = leaves.filter((lf) => {
    const s = new Date(lf.startDate);
    s.setHours(0, 0, 0, 0);
    return s > today;
  });

  // Filter history leaves (searches all leaves dynamically)
  const getFilteredHistory = () => {
    if (!hasSearched) return [];
    return leaves.filter((lf) => {
      // 1. Search candidate name
      if (searchQuery.trim() !== '' && !lf.employeeName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // 2. Client
      if (filterClient !== 'all' && lf.clientCompany !== filterClient) {
        return false;
      }
      // 3. Leave Type
      if (filterType !== 'all' && lf.leaveType !== filterType) {
        return false;
      }
      // 4. Month (start date matching)
      const sDate = new Date(lf.startDate);
      if (filterMonth !== 'all' && (sDate.getMonth() + 1).toString() !== filterMonth) {
        return false;
      }
      // 5. Year (start date matching)
      if (filterYear !== 'all' && sDate.getFullYear().toString() !== filterYear) {
        return false;
      }
      // 6. Date Range
      if (filterStartDate && lf.startDate < filterStartDate) {
        return false;
      }
      if (filterEndDate && lf.endDate > filterEndDate) {
        return false;
      }
      // 7. Status
      if (filterStatus !== 'all') {
        const todayVal = getTodayDateOnly();
        const status = getLeaveStatus(lf, todayVal);
        if (filterStatus !== status) {
          return false;
        }
      }
      return true;
    });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setHasSearched(true);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterClient('all');
    setFilterType('all');
    setFilterMonth('all');
    setFilterYear('all');
    setFilterStatus('all');
    setFilterStartDate('');
    setFilterEndDate('');
    setHasSearched(false);
  };

  // Actions
  const handleOpenBookModal = () => {
    setEditingId(null);
    setUserId('');
    setLeaveType('Casual');
    setStartDate('');
    setEndDate('');
    setReason('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (lf) => {
    setEditingId(lf.id);
    setUserId(lf.userId);
    setLeaveType(lf.leaveType);
    setStartDate(lf.startDate);
    setEndDate(lf.endDate);
    setReason(lf.reason || '');
    setIsModalOpen(true);
  };

  const handleSaveLeave = async (e) => {
    e.preventDefault();
    if (!userId || !leaveType || !startDate || !endDate) {
      setToast({ message: 'Please fill in all required fields.', type: 'error' });
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setToast({ message: 'Start date cannot be after end date.', type: 'error' });
      return;
    }

    setSubmitting(true);
    const payload = {
      userId,
      leaveType,
      startDate,
      endDate,
      reason: reason.trim() || null,
    };

    try {
      if (editingId) {
        await api.put(`/admin/leaves/${editingId}`, payload);
        setToast({ message: 'Leave record updated successfully.', type: 'success' });
      } else {
        await api.post('/admin/leaves', payload);
        setToast({ message: 'Leave record registered successfully.', type: 'success' });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || 'Failed to save leave record.';
      setToast({ message: msg, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelLeave = async (id, employeeName) => {
    if (confirm(`Are you sure you want to cancel the leave record for ${employeeName}?`)) {
      try {
        await api.delete(`/admin/leaves/${id}`);
        setToast({ message: 'Leave record cancelled successfully.', type: 'success' });
        loadData();
      } catch (err) {
        console.error(err);
        setToast({ message: 'Failed to cancel leave record.', type: 'error' });
      }
    }
  };

  // Get unique clients for search dropdown
  const uniqueClients = [...new Set(leaves.map((l) => l.clientCompany))].filter(Boolean);

  if (loading) {
    return (
      <div className="min-h-[50vh] w-full flex flex-col items-center justify-center gap-3 text-white">
        <RotateCw className="w-8 h-8 text-[#FF7A00] animate-spin" />
        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Loading leave schedules...</span>
      </div>
    );
  }

  const filteredHistory = getFilteredHistory();

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-8 animate-fade-in text-white pb-16 px-4 font-sans">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-[#FF7A00] flex items-center justify-center shadow-lg shadow-[#FF7A00]/5">
            <Calendar size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Leave Management</h1>
            <p className="text-xs text-gray-400 font-medium">Examine current and upcoming candidate leaves, or audit logs.</p>
          </div>
        </div>
        <button
          onClick={handleOpenBookModal}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-[#FF7A00] hover:bg-[#FF8C1A] text-white rounded-xl text-xs font-bold transition shadow-lg shadow-[#FF7A00]/10 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={14} />
          <span>Book Employee Leave</span>
        </button>
      </div>

      {/* 1. Current Leaves Section */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#FF7A00] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FF7A00] animate-pulse"></span>
          <span>Current Leaves ({currentLeaves.length})</span>
        </h2>
        {currentLeaves.length === 0 ? (
          <div className="border border-white/5 bg-[#111111] rounded-2xl p-10 text-center text-gray-500 shadow-xl">
            <AlertTriangle size={24} className="mx-auto text-gray-600 mb-2.5" />
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">No employees are currently on leave.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {currentLeaves.map((lf) => {
              const days = getLeaveDays(lf.startDate, lf.endDate);
              return (
                <div key={lf.id} className="bg-[#111111] border border-white/5 p-5.5 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden transition hover:border-[#FF7A00]/20">
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-[#FF7A00]"></div>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-bold text-white leading-tight">{lf.employeeName}</h3>
                        <span className="text-[10px] text-gray-500 font-semibold">{lf.clientCompany}</span>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 text-[#FF7A00] font-black uppercase rounded-md flex items-center gap-1 shrink-0 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A00]"></span>
                        <span>On Leave</span>
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-gray-300 font-bold uppercase tracking-wider">
                        {lf.leaveType} Leave
                      </span>
                      <span className="text-[10px] font-bold text-gray-400">
                        {days} {days === 1 ? 'day' : 'days'} total
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs border-t border-white/5 pt-3.5 mt-2">
                      <div>
                        <span className="text-[9px] text-gray-500 block uppercase tracking-wider font-bold">Start Date</span>
                        <span className="text-gray-300 font-semibold">{lf.startDate}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-500 block uppercase tracking-wider font-bold">End Date</span>
                        <span className="text-gray-300 font-semibold">{lf.endDate}</span>
                      </div>
                    </div>

                    {lf.reason && (
                      <p className="text-[11px] text-gray-400 font-medium italic mt-1 bg-white/[0.02] p-2.5 rounded-xl border border-white/5 truncate">
                        "{lf.reason}"
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2.5 border-t border-white/5 pt-4 mt-4 justify-end">
                    <button
                      onClick={() => handleOpenEditModal(lf)}
                      className="px-3.5 py-2 border border-white/5 hover:border-[#FF7A00] text-gray-400 hover:text-white hover:bg-[#FF7A00]/10 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 size={12} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleCancelLeave(lf.id, lf.employeeName)}
                      className="px-3.5 py-2 border border-rose-500/10 hover:border-rose-500 text-rose-400 hover:text-white hover:bg-rose-500/10 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={12} />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Upcoming Leaves Section */}
      <div className="flex flex-col gap-4 border-t border-white/5 pt-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-500"></span>
          <span>Upcoming Leaves ({upcomingLeaves.length})</span>
        </h2>
        {upcomingLeaves.length === 0 ? (
          <div className="border border-white/5 bg-[#111111] rounded-2xl p-10 text-center text-gray-500 shadow-xl">
            <AlertTriangle size={24} className="mx-auto text-gray-600 mb-2.5" />
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">No upcoming leaves scheduled.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {upcomingLeaves.map((lf) => {
              const days = getLeaveDays(lf.startDate, lf.endDate);
              const remaining = getDaysRemaining(lf.startDate);
              return (
                <div key={lf.id} className="bg-[#111111] border border-white/5 p-5.5 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden transition hover:border-[#FF7A00]/20">
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-sky-500"></div>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-bold text-white leading-tight">{lf.employeeName}</h3>
                        <span className="text-[10px] text-gray-500 font-semibold">{lf.clientCompany}</span>
                      </div>
                      <span className="text-[9px] px-2.5 py-1 bg-sky-500/10 border border-sky-500/20 text-sky-400 font-black uppercase rounded-md shrink-0">
                        {remaining} {remaining === 1 ? 'day' : 'days'} left
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-gray-300 font-bold uppercase tracking-wider">
                        {lf.leaveType} Leave
                      </span>
                      <span className="text-[10px] font-bold text-gray-400">
                        {days} {days === 1 ? 'day' : 'days'} total
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs border-t border-white/5 pt-3.5 mt-2">
                      <div>
                        <span className="text-[9px] text-gray-500 block uppercase tracking-wider font-bold">Start Date</span>
                        <span className="text-gray-300 font-semibold">{lf.startDate}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-500 block uppercase tracking-wider font-bold">End Date</span>
                        <span className="text-gray-300 font-semibold">{lf.endDate}</span>
                      </div>
                    </div>

                    {lf.reason && (
                      <p className="text-[11px] text-gray-400 font-medium italic mt-1 bg-white/[0.02] p-2.5 rounded-xl border border-white/5 truncate">
                        "{lf.reason}"
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2.5 border-t border-white/5 pt-4 mt-4 justify-end">
                    <button
                      onClick={() => handleOpenEditModal(lf)}
                      className="px-3.5 py-2 border border-white/5 hover:border-[#FF7A00] text-gray-400 hover:text-white hover:bg-[#FF7A00]/10 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 size={12} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleCancelLeave(lf.id, lf.employeeName)}
                      className="px-3.5 py-2 border border-rose-500/10 hover:border-rose-500 text-rose-400 hover:text-white hover:bg-rose-500/10 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={12} />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Search Leave History Section */}
      <div className="flex flex-col gap-4 border-t border-white/5 pt-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
          <Search size={14} />
          <span>Search Leave History</span>
        </h2>
        
        <div className="flex flex-col gap-6">
          {/* Filter Search Form Panel */}
          <form onSubmit={handleSearchSubmit} className="bg-[#111111] border border-white/5 p-6 rounded-2xl shadow-xl flex flex-col gap-4 animate-fade-in">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-500/95 border-b border-white/5 pb-2">
              <SlidersHorizontal size={14} />
              <span>Define Search Parameters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Candidate Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Candidate Name</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search candidate..."
                  className="w-full h-10 bg-[#1A1A1A] border border-white/5 text-xs text-white rounded-xl px-3 outline-none focus:border-[#FF7A00] transition"
                />
              </div>

              {/* Client Company */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Client Company</label>
                <select
                  value={filterClient}
                  onChange={(e) => setFilterClient(e.target.value)}
                  className="w-full h-10 bg-[#1A1A1A] border border-white/5 text-xs text-white rounded-xl px-3 outline-none focus:border-[#FF7A00] transition cursor-pointer"
                >
                  <option value="all">All Clients</option>
                  {uniqueClients.map((client) => (
                    <option key={client} value={client}>{client}</option>
                  ))}
                </select>
              </div>

              {/* Leave Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Leave Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full h-10 bg-[#1A1A1A] border border-white/5 text-xs text-white rounded-xl px-3 outline-none focus:border-[#FF7A00] transition cursor-pointer"
                >
                  <option value="all">All Types</option>
                  <option value="Casual">Casual Leave</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Annual">Annual Leave</option>
                  <option value="Unpaid">Unpaid Leave</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full h-10 bg-[#1A1A1A] border border-white/5 text-xs text-white rounded-xl px-3 outline-none focus:border-[#FF7A00] transition cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Current">Current (On Leave)</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              {/* Month */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Month</label>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="w-full h-10 bg-[#1A1A1A] border border-white/5 text-xs text-white rounded-xl px-3 outline-none focus:border-[#FF7A00] transition cursor-pointer"
                >
                  <option value="all">All Months</option>
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
              </div>

              {/* Year */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Year</label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="w-full h-10 bg-[#1A1A1A] border border-white/5 text-xs text-white rounded-xl px-3 outline-none focus:border-[#FF7A00] transition cursor-pointer"
                >
                  <option value="all">All Years</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>

              {/* Start Date (From) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Start Date (From)</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full h-10 bg-[#1A1A1A] border border-white/5 text-xs text-white rounded-xl px-3 outline-none focus:border-[#FF7A00] transition"
                />
              </div>

              {/* End Date (To) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">End Date (To)</label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full h-10 bg-[#1A1A1A] border border-white/5 text-xs text-white rounded-xl px-3 outline-none focus:border-[#FF7A00] transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3.5 border-t border-white/5 pt-4 mt-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 border border-white/5 hover:bg-white/5 text-gray-400 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Clear Filters
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-6 py-2.5 bg-[#FF7A00] hover:bg-[#FF8C1A] text-white rounded-xl text-xs font-bold shadow-md shadow-[#FF7A00]/10 transition cursor-pointer"
              >
                <Search size={13} />
                <span>Search Logs</span>
              </button>
            </div>
          </form>

          {/* Results Grid / Table */}
          {!hasSearched ? (
            <div className="border border-white/5 bg-[#111111] rounded-2xl p-10 text-center text-gray-500 shadow-xl">
              <Search size={24} className="mx-auto text-gray-600 mb-2.5 animate-pulse" />
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Define filter options above and click Search Logs.</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="border border-white/5 bg-[#111111] rounded-2xl p-10 text-center text-gray-500 shadow-xl animate-fade-in">
              <AlertTriangle size={24} className="mx-auto text-gray-600 mb-2.5" />
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">No matching leave history found.</p>
            </div>
          ) : (
            <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden shadow-2xl overflow-x-auto animate-fade-in">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-black/40 text-gray-400 uppercase text-[9px] tracking-wider font-bold">
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Client Company</th>
                    <th className="px-4 py-3">Leave Type</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-300">
                  {filteredHistory.map((lf) => {
                    const days = getLeaveDays(lf.startDate, lf.endDate);
                    return (
                      <tr key={lf.id} className="hover:bg-white/[0.01] transition">
                        <td className="px-4 py-3.5 font-bold text-white">{lf.employeeName}</td>
                        <td className="px-4 py-3.5 font-semibold text-gray-400">{lf.clientCompany}</td>
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 text-[9px] font-bold rounded-lg border uppercase bg-white/5 border-white/10 text-gray-300">
                            {lf.leaveType}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-gray-400">
                          {lf.startDate} to {lf.endDate} ({days} {days === 1 ? 'day' : 'days'})
                        </td>
                        <td className="px-4 py-3.5">
                          {(() => {
                            const status = getLeaveStatus(lf, getTodayDateOnly());
                            if (status === 'Upcoming') {
                              return (
                                <span className="px-2 py-0.5 text-[9px] font-bold rounded-lg border uppercase tracking-wider bg-sky-500/10 border-sky-500/20 text-sky-400">
                                  Upcoming
                                </span>
                              );
                            }
                            if (status === 'Current') {
                              return (
                                <span className="px-2 py-0.5 text-[9px] font-bold rounded-lg border uppercase tracking-wider bg-orange-500/10 border-orange-500/20 text-[#FF7A00]">
                                  On Leave
                                </span>
                              );
                            }
                            return (
                              <span className="px-2 py-0.5 text-[9px] font-bold rounded-lg border uppercase tracking-wider bg-gray-500/10 border-gray-500/20 text-gray-400">
                                Completed
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3.5 text-gray-500 italic max-w-[200px] truncate" title={lf.reason}>
                          {lf.reason ? `"${lf.reason}"` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Book/Edit Leave Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={() => !submitting && setIsModalOpen(false)}></div>
          
          <div className="relative z-10 w-full max-w-md bg-[#111111] border border-white/5 rounded-2xl overflow-hidden shadow-2xl p-6 animate-scale-in">
            <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-5">
              <h3 className="text-base font-bold flex items-center gap-2 text-white">
                <Calendar size={18} className="text-[#FF7A00]" />
                <span>{editingId ? 'Edit Leave Schedule' : 'Book Leave Schedule'}</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
                className="p-1 text-gray-400 hover:text-white rounded transition cursor-pointer disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveLeave} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Employee</label>
                <select
                  required
                  disabled={!!editingId}
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full h-11 bg-[#1A1A1A] border border-white/5 text-white rounded-xl px-3 text-xs focus:outline-none focus:border-[#FF7A00] transition cursor-pointer disabled:opacity-50"
                >
                  <option value="">Select Employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Leave Type</label>
                <select
                  required
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full h-11 bg-[#1A1A1A] border border-white/5 text-white rounded-xl px-3 text-xs focus:outline-none focus:border-[#FF7A00] transition cursor-pointer"
                >
                  <option value="Casual">Casual Leave</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Annual">Annual Leave</option>
                  <option value="Unpaid">Unpaid Leave</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-11 bg-[#1A1A1A] border border-white/5 text-white rounded-xl px-3 text-xs focus:outline-none focus:border-[#FF7A00] transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-11 bg-[#1A1A1A] border border-white/5 text-white rounded-xl px-3 text-xs focus:outline-none focus:border-[#FF7A00] transition"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Reason (Optional)</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Leave details..."
                  rows={2}
                  className="w-full bg-[#1A1A1A] border border-white/5 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-[#FF7A00] transition resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end border-t border-white/5 pt-4 mt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-white/5 hover:bg-white/5 text-gray-400 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#FF7A00] hover:bg-[#FF8C1A] text-white rounded-xl text-xs font-bold shadow-lg shadow-[#FF7A00]/15 transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Leave'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

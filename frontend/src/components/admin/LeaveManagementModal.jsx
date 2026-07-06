import { useState, useEffect, useCallback } from 'react';
import { Calendar, X, Trash2, Edit3, Plus, AlertTriangle, Users } from 'lucide-react';
import api from '../../services/api';

export default function LeaveManagementModal({ isOpen, onClose, setToast }) {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [editingId, setEditingId] = useState(null); // null = adding, otherwise editing ID
  const [userId, setUserId] = useState('');
  const [leaveType, setLeaveType] = useState('Casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/leaves');
      setLeaves(res.data || []);
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to retrieve leaves list.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [setToast]);

  const loadEmployees = useCallback(async () => {
    try {
      const res = await api.get('/admin/employees');
      setEmployees(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadLeaves();
      loadEmployees();
      resetForm();
    }
  }, [isOpen, loadLeaves, loadEmployees]);

  if (!isOpen) return null;

  const resetForm = () => {
    setEditingId(null);
    setUserId('');
    setLeaveType('Casual');
    setStartDate('');
    setEndDate('');
    setReason('');
  };

  const handleEditClick = (lf) => {
    setEditingId(lf.id);
    setUserId(lf.userId);
    setLeaveType(lf.leaveType);
    setStartDate(lf.startDate);
    setEndDate(lf.endDate);
    setReason(lf.reason || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId || !leaveType || !startDate || !endDate) {
      setToast({ message: 'All fields except reason are required.', type: 'error' });
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
      reason: reason.trim() || null
    };

    try {
      if (editingId) {
        await api.put(`/admin/leaves/${editingId}`, payload);
        setToast({ message: 'Leave record updated successfully.', type: 'success' });
      } else {
        await api.post('/admin/leaves', payload);
        setToast({ message: 'Leave record created successfully.', type: 'success' });
      }
      resetForm();
      loadLeaves();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || 'Failed to save leave details.';
      setToast({ message: msg, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = async (lf) => {
    if (confirm(`Are you sure you want to delete the leave record for ${lf.employeeName}?`)) {
      try {
        await api.delete(`/admin/leaves/${lf.id}`);
        setToast({ message: 'Leave record deleted successfully.', type: 'success' });
        if (editingId === lf.id) {
          resetForm();
        }
        loadLeaves();
      } catch (err) {
        console.error(err);
        setToast({ message: 'Failed to delete leave record.', type: 'error' });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay backdrop */}
      <div className="absolute inset-0 bg-[#0b0f19]/85 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>

      {/* Card panel */}
      <div className="relative z-10 w-full max-w-5xl bg-[#111111] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-2xl animate-scale-in flex flex-col max-h-[90vh] text-white">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#2A2A2A] flex items-center justify-between">
          <h3 className="text-base font-bold flex items-center gap-2 text-white">
            <Users size={18} className="text-[#FF7A00]" />
            <span>Leave Management</span>
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded transition cursor-pointer" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Content Body - Split Layout */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-5 gap-6">
          
          {/* Left Panel: Leave Form (2/5 Cols) */}
          <div className="md:col-span-2 flex flex-col gap-4 bg-[#1A1A1A] border border-[#2A2A2A] p-5 rounded-xl h-fit">
            <h4 className="text-xs font-bold text-[#FF7A00] uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <span>{editingId ? 'Edit Leave' : 'Book Leave'}</span>
            </h4>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="leave-employee" className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Employee</label>
                <select
                  id="leave-employee"
                  required
                  disabled={!!editingId}
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full h-11 bg-[#111111] border border-[#2A2A2A] text-white rounded-xl px-3 text-xs focus:outline-none focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] transition cursor-pointer disabled:opacity-50"
                >
                  <option value="">Select Employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="leave-type" className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Leave Type</label>
                <select
                  id="leave-type"
                  required
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full h-11 bg-[#111111] border border-[#2A2A2A] text-white rounded-xl px-3 text-xs focus:outline-none focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] transition cursor-pointer"
                >
                  <option value="Casual">Casual Leave</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Annual">Annual Leave</option>
                  <option value="Unpaid">Unpaid Leave</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="leave-start" className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Start Date</label>
                  <input
                    id="leave-start"
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-11 bg-[#111111] border border-[#2A2A2A] text-white rounded-xl px-3 text-xs focus:outline-none focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="leave-end" className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">End Date</label>
                  <input
                    id="leave-end"
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-11 bg-[#111111] border border-[#2A2A2A] text-white rounded-xl px-3 text-xs focus:outline-none focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] transition"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="leave-reason" className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Reason (Optional)</label>
                <textarea
                  id="leave-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason details..."
                  rows={2}
                  className="w-full bg-[#111111] border border-[#2A2A2A] text-white rounded-xl p-3 text-xs focus:outline-none focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] transition resize-none"
                />
              </div>

              <div className="flex gap-2 mt-2">
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 h-10 border border-[#2A2A2A] hover:bg-white/5 text-[#B3B3B3] hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-10 bg-[#FF7A00] hover:bg-[#FF8C1A] text-white rounded-xl text-xs font-bold shadow-lg shadow-[#FF7A00]/20 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {editingId ? <Edit3 size={13} /> : <Plus size={13} />}
                  <span>{submitting ? 'Saving...' : (editingId ? 'Update' : 'Save')}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Panel: Leave List Table (3/5 Cols) */}
          <div className="md:col-span-3 flex flex-col gap-4">
            <h4 className="text-xs font-bold text-[#B3B3B3] uppercase tracking-wider">
              Approved Leave Schedule
            </h4>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <div className="w-6 h-6 border-2 border-[#FF7A00] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Loading leaves...</span>
              </div>
            ) : leaves.length === 0 ? (
              <div className="border border-[#2A2A2A] border-dashed rounded-xl p-8 text-center text-gray-500">
                <AlertTriangle size={24} className="mx-auto text-gray-600 mb-2" />
                <p className="text-xs font-semibold">No leaves currently scheduled.</p>
              </div>
            ) : (
              <div className="border border-[#2A2A2A] rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#2A2A2A] bg-black/40 text-[#B3B3B3] uppercase text-[9px] tracking-wider font-bold">
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Leave Type</th>
                      <th className="px-4 py-3">Duration</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2A2A] text-gray-300">
                    {leaves.map((lf) => (
                      <tr key={lf.id} className="hover:bg-white/[0.01] transition">
                        <td className="px-4 py-3.5 font-bold text-white max-w-[120px] truncate" title={lf.employeeName}>
                          {lf.employeeName}
                          {lf.reason && (
                            <span className="block text-[9px] font-normal text-gray-500 truncate">{lf.reason}</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-lg border uppercase tracking-wider ${
                            lf.leaveType === 'Sick'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : lf.leaveType === 'Annual'
                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                : lf.leaveType === 'Casual'
                                  ? 'bg-[#FF7A00]/10 text-[#FF7A00] border-[#FF7A00]/20'
                                  : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                          }`}>
                            {lf.leaveType}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono font-medium text-gray-400">
                          {lf.startDate === lf.endDate ? (
                            <span>{lf.startDate}</span>
                          ) : (
                            <span>{lf.startDate} to {lf.endDate}</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEditClick(lf)}
                            className="p-1 border border-white/5 hover:border-[#FF7A00] text-gray-400 hover:text-white hover:bg-[#FF7A00]/10 rounded-lg transition cursor-pointer"
                            title="Edit Leave"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(lf)}
                            className="p-1 border border-rose-500/20 hover:border-rose-500 text-rose-400 hover:text-white hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                            title="Delete Leave"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

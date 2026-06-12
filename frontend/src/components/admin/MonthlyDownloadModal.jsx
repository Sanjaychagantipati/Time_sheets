import React, { useState, useEffect } from 'react';
import { FileDown, X } from 'lucide-react';
import { timesheetService } from '../../services/timesheetService';

export default function MonthlyDownloadModal({ isOpen, onClose, setToast }) {
  const [employees, setEmployees] = useState([]);
  const [userId, setUserId] = useState('');
  const [yearMonth, setYearMonth] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    async function loadCandidates() {
      try {
        const list = await timesheetService.getEmployeesList();
        setEmployees(list);
        if (list.length > 0) {
          setUserId(list[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadCandidates();

    // Default to current month
    const today = new Date();
    const currentMonth = today.toISOString().substring(0, 7); // YYYY-MM
    setYearMonth(currentMonth);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await timesheetService.exportMonthlyBillingReport(userId, yearMonth);
      setToast({ message: 'Monthly billing report generated successfully.', type: 'success' });
      onClose();
    } catch (err) {
      console.error(err);
      setToast({ message: err.message || 'No logged hours found for the selected candidate and month.', type: 'warning' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay backdrop */}
      <div className="absolute inset-0 bg-[#0b0f19]/80 backdrop-blur-sm" onClick={onClose}></div>

      {/* Card panel */}
      <div className="relative z-10 w-full max-w-md glass bg-[#121826]/90 border border-white/5 rounded-2xl overflow-hidden shadow-2xl animate-scale-in">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-base font-bold flex items-center gap-2">
            <FileDown size={16} className="text-indigo-400" />
            <span>Monthly Candidate Downloader</span>
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded transition" aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 flex flex-col gap-4">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Select Candidate</label>
              <select
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="bg-[#1a2336] border border-white/5 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Select Month</label>
              <input
                type="month"
                required
                value={yearMonth}
                onChange={(e) => setYearMonth(e.target.value)}
                className="bg-[#1a2336] border border-white/5 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

          </div>

          <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-white/10 hover:border-gray-500 text-gray-300 hover:text-white rounded-xl text-sm font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/20 transition"
            >
              {submitting ? 'Generating...' : 'Generate & Download CSV'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

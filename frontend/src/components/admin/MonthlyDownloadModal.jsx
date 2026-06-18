import React, { useState, useEffect } from 'react';
import { FileDown, X } from 'lucide-react';
import { timesheetService } from '../../services/timesheetService';

export default function MonthlyDownloadModal({ isOpen, onClose, setToast }) {
  const [employees, setEmployees] = useState([]);
  const [candidateName, setCandidateName] = useState('');
  const [yearMonth, setYearMonth] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    async function loadCandidates() {
      try {
        const list = await timesheetService.getEmployeesList();
        setEmployees(list);
        if (list.length > 0) {
          setCandidateName(list[0].name);
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
    
    const trimmedName = candidateName.trim();
    const matched = employees.find(
      (emp) => emp.name.toLowerCase() === trimmedName.toLowerCase() || emp.username.toLowerCase() === trimmedName.toLowerCase()
    );

    if (!matched) {
      setToast({ message: 'Candidate not found. Please select or type an existing candidate name.', type: 'error' });
      setSubmitting(false);
      return;
    }

    try {
      await timesheetService.exportMonthlyBillingReport(matched.id, yearMonth, matched.name);
      setToast({ message: 'Monthly attendance report generated successfully.', type: 'success' });
      onClose();
    } catch (err) {
      console.error(err);
      setToast({ message: err.message || 'Failed to generate attendance report.', type: 'warning' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

      {/* Card panel */}
      <div className="relative z-10 w-full max-w-md bg-[#111111] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-2xl animate-scale-in">
        <div className="px-6 py-4 border-b border-[#2A2A2A] flex items-center justify-between">
          <h3 className="text-base font-bold flex items-center gap-2">
            <FileDown size={16} className="text-[#FF7A00]" />
            <span>Generate Monthly Attendance Report</span>
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded transition cursor-pointer" aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 flex flex-col gap-4">
            
            <div className="flex flex-col gap-1.5">
              <label htmlFor="download-monthly-candidate-input" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Select Candidate</label>
              <input
                id="download-monthly-candidate-input"
                name="candidateName"
                list="download-monthly-employees"
                required
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="Type or select candidate..."
                className="w-full h-14 bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl px-4 text-sm focus:outline-none focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] transition"
              />
              <datalist id="download-monthly-employees">
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.name} />
                ))}
              </datalist>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="download-monthly-month" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Select Month</label>
              <input
                id="download-monthly-month"
                name="yearMonth"
                type="month"
                required
                value={yearMonth}
                onChange={(e) => setYearMonth(e.target.value)}
                className="bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] transition"
              />
            </div>

          </div>

          <div className="px-6 py-4 border-t border-[#2A2A2A] flex justify-end gap-3 bg-black/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#2A2A2A] hover:bg-white/5 text-[#B3B3B3] hover:text-white rounded-xl text-sm font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#FF7A00] hover:bg-[#FF8C1A] disabled:bg-[#FF7A00]/50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-[#FF7A00]/20 transition cursor-pointer"
            >
              {submitting ? 'Generating...' : 'Download PDF'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

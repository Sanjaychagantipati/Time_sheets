import { useState, useEffect } from 'react';
import { ClipboardCheck, X, AlertTriangle } from 'lucide-react';
import { timesheetService } from '../../services/timesheetService';
import { formatDateFriendly, formatTime12h } from '../../utils/formatters';
import { calculateHours } from '../../utils/dateUtils';

export default function ResolveExceptionModal({ isOpen, exception, onClose, onSuccess, setToast }) {
  const [clockOut, setClockOut] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load defaults when modal opens
  useEffect(() => {
    if (!isOpen || !exception) return;
    setClockOut('');
    setNotes(exception.notes || '');
  }, [isOpen, exception]);

  if (!isOpen || !exception) return null;



  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!clockOut) {
      setToast({ message: 'Clock Out time is required to resolve exception.', type: 'error' });
      return;
    }

    const hrs = calculateHours(exception.clockIn, clockOut);
    if (hrs === null) {
      setToast({ message: 'Clock Out time must be later than Clock In time.', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        userId: exception.userId,
        date: exception.date,
        clockIn: exception.clockIn,
        clockOut: clockOut,
        notes: notes.trim() || undefined,
        clientCompany: exception.clientCompany,
      };

      await timesheetService.updateLog(exception.id, payload);
      setToast({ message: 'Attendance exception resolved successfully!', type: 'success' });
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.message || 'Failed to resolve attendance exception.';
      setToast({ message: errMsg, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const currentDuration = clockOut ? calculateHours(exception.clockIn, clockOut) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay backdrop */}
      <div className="absolute inset-0 bg-[#0b0f19]/80 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>

      {/* Modal panel */}
      <div className="relative z-10 w-full max-w-md bg-[#121826]/95 border border-white/5 rounded-2xl overflow-visible shadow-2xl animate-scale-in mx-auto">
        <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between rounded-t-2xl bg-black/10">
          <h3 className="text-sm font-bold flex items-center gap-2 text-white">
            <ClipboardCheck size={15} className="text-[#FF7A00]" />
            <span>Resolve Attendance Exception</span>
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded transition cursor-pointer" aria-label="Close modal">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-5 flex flex-col gap-4">
            
            {/* Read-Only Details Grid */}
            <div className="bg-black/20 border border-white/5 rounded-xl p-4 grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block mb-0.5">Candidate</span>
                <span className="text-white font-semibold">{exception.employeeName}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block mb-0.5">Client Company</span>
                <span className="text-white font-semibold">{exception.clientCompany}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block mb-0.5">Attendance Date</span>
                <span className="text-white font-semibold">{formatDateFriendly(exception.date)}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block mb-0.5">Clock In Time</span>
                <span className="text-white font-mono font-semibold">{formatTime12h(exception.clockIn)}</span>
              </div>
            </div>

            {/* Editable Clock Out Time */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="resolve-clockout" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Clock Out Time</label>
              <input
                id="resolve-clockout"
                name="clockOut"
                type="time"
                step="1"
                required
                value={clockOut}
                onChange={(e) => setClockOut(e.target.value)}
                className="bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl px-4 h-11 text-sm focus:outline-none focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] transition"
              />
            </div>

            {/* Calculated Hours Display */}
            {clockOut && (
              currentDuration === null ? (
                <div className="text-[10px] text-rose-400 font-semibold flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl">
                  <AlertTriangle size={12} />
                  <span>Clock Out time must be later than Clock In time.</span>
                </div>
              ) : (
                <div className="text-[10px] text-emerald-400 font-semibold flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
                  <span>Calculated Hours:</span>
                  <span className="text-xs font-bold text-white">{currentDuration} hours</span>
                </div>
              )
            )}

            {/* Optional Reason / Notes */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="resolve-reason" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Reason / Correction Notes (Optional)</label>
              <textarea
                id="resolve-reason"
                name="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for missing clock out or correction details..."
                rows={2}
                className="bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl p-3 text-sm focus:outline-none focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] transition resize-none"
              />
            </div>

          </div>

          <div className="px-5 py-3.5 border-t border-white/5 flex justify-end gap-3 bg-black/10 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-white/10 hover:border-gray-500 text-gray-300 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#FF7A00] hover:bg-[#FF8C1A] disabled:bg-[#FF7A00]/50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-[#FF7A00]/20 transition cursor-pointer"
            >
              {submitting ? 'Resolving...' : 'Save Resolution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { CalendarPlus, Edit3, X } from 'lucide-react';
import { timesheetService } from '../../services/timesheetService';

export default function EditLogModal({ isOpen, logId, onClose, onSuccess, setToast }) {
  const [employees, setEmployees] = useState([]);
  const [userId, setUserId] = useState('');
  const [date, setDate] = useState('');
  const [clockIn, setClockIn] = useState('09:00:00');
  const [clockOut, setClockOut] = useState('17:00:00');
  const [notes, setNotes] = useState('');
  const [clientCompany, setClientCompany] = useState('Microsoft');
  const [location, setLocation] = useState('HQ Office (Manual)');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch candidate list on open
  useEffect(() => {
    if (!isOpen) return;
    async function loadCandidates() {
      try {
        const list = await timesheetService.getEmployeesList();
        setEmployees(list);
        if (list.length > 0 && !logId) {
          setUserId(list[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadCandidates();
  }, [isOpen, logId]);

  // Load log details if editing
  useEffect(() => {
    if (!isOpen || !logId) {
      // Manual Add Defaults
      setDate(new Date().toISOString().split('T')[0]);
      setClockIn('09:00:00');
      setClockOut('17:00:00');
      setNotes('');
      setClientCompany('Microsoft');
      setLocation('HQ Office (Manual)');
      return;
    }

    async function loadLogDetails() {
      setLoading(true);
      try {
        const list = await timesheetService.getAdminTimesheets({ userId: 'all' });
        const log = list.find((t) => t.id === logId);
        if (log) {
          setUserId(log.userId);
          setDate(log.date);
          setClockIn(log.clockIn);
          setClockOut(log.clockOut || '');
          setNotes(log.notes || '');
          setClientCompany(log.clientCompany || 'Microsoft');
          setLocation(log.location || '');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadLogDetails();
  }, [isOpen, logId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        userId,
        date,
        clockIn,
        clockOut: clockOut || null,
        notes,
        location,
        clientCompany,
      };

      if (logId) {
        await timesheetService.updateLog(logId, payload);
        setToast({ message: 'Timesheet record adjusted successfully.', type: 'success' });
      } else {
        await timesheetService.createManualLog(payload);
        setToast({ message: 'Manual timesheet entry created.', type: 'success' });
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to save timesheet record.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay backdrop */}
      <div className="absolute inset-0 bg-[#0b0f19]/80 backdrop-blur-sm" onClick={onClose}></div>

      {/* Card panel */}
      <div className="relative z-10 w-full max-w-lg glass bg-[#121826]/90 border border-white/5 rounded-2xl overflow-hidden shadow-2xl animate-scale-in">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-base font-bold flex items-center gap-2">
            {logId ? (
              <>
                <Edit3 size={16} className="text-indigo-400" />
                <span>Adjust Timesheet Record</span>
              </>
            ) : (
              <>
                <CalendarPlus size={16} className="text-indigo-400" />
                <span>Add Manual Timesheet Entry</span>
              </>
            )}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded transition" aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-gray-400">Loading details...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="p-6 flex flex-col gap-4">
              
              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-log-candidate" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Candidate</label>
                <select
                  id="edit-log-candidate"
                  name="userId"
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  disabled={!!logId} // Don't let admin change owner on edit
                  className="bg-[#1a2336] border border-white/5 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition disabled:opacity-50"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.clientCompany || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-log-date" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</label>
                <input
                  id="edit-log-date"
                  name="date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-[#1a2336] border border-white/5 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="edit-log-clockin" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Clock In Time</label>
                  <input
                    id="edit-log-clockin"
                    name="clockIn"
                    type="time"
                    required
                    step="1"
                    value={clockIn}
                    onChange={(e) => setClockIn(e.target.value)}
                    className="bg-[#1a2336] border border-white/5 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="edit-log-clockout" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Clock Out Time</label>
                  <input
                    id="edit-log-clockout"
                    name="clockOut"
                    type="time"
                    step="1"
                    value={clockOut}
                    onChange={(e) => setClockOut(e.target.value)}
                    placeholder="Still active (leave blank)"
                    className="bg-[#1a2336] border border-white/5 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-log-notes" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Work Notes / Tasks</label>
                <textarea
                  id="edit-log-notes"
                  name="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter details of tasks accomplished..."
                  rows={2}
                  className="bg-[#1a2336] border border-white/5 text-white rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 transition resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="edit-log-client" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Client Company</label>
                  <select
                    id="edit-log-client"
                    name="clientCompany"
                    value={clientCompany}
                    onChange={(e) => setClientCompany(e.target.value)}
                    className="bg-[#1a2336] border border-white/5 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition"
                  >
                    <option value="Microsoft">Microsoft</option>
                    <option value="Google">Google</option>
                    <option value="Meta">Meta</option>
                    <option value="Amazon">Amazon</option>
                    <option value="Netflix">Netflix</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="edit-log-location" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Location Label</label>
                  <input
                    id="edit-log-location"
                    name="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Remote (Simulated)"
                    className="bg-[#1a2336] border border-white/5 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
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
                {submitting ? 'Saving...' : logId ? 'Save Changes' : 'Add Entry'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

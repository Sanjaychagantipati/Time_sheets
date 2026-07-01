import { useState, useEffect, useCallback } from 'react';
import { Calendar, X, Trash2, Edit3, Plus, AlertTriangle } from 'lucide-react';
import { timesheetService } from '../../services/timesheetService';

export default function HolidayManagementModal({ isOpen, onClose, setToast }) {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [editingId, setEditingId] = useState(null); // null = adding, otherwise editing ID
  const [holidayName, setHolidayName] = useState('');
  const [holidayDate, setHolidayDate] = useState('');
  const [description, setDescription] = useState('');
  const [holidayType, setHolidayType] = useState('Public Holiday');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadHolidays = useCallback(async () => {
    setLoading(true);
    try {
      const data = await timesheetService.getHolidaysList();
      // Sort by date ascending
      data.sort((a, b) => new Date(a.holidayDate) - new Date(b.holidayDate));
      setHolidays(data);
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to retrieve holidays.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [setToast]);

  useEffect(() => {
    if (isOpen) {
      loadHolidays();
      resetForm();
    }
  }, [isOpen, loadHolidays]);

  if (!isOpen) return null;

  const resetForm = () => {
    setEditingId(null);
    setHolidayName('');
    setHolidayDate('');
    setDescription('');
    setHolidayType('Public Holiday');
    setIsActive(true);
  };

  const handleEditClick = (h) => {
    setEditingId(h.id);
    setHolidayName(h.holidayName);
    setHolidayDate(h.holidayDate);
    setDescription(h.description || '');
    setHolidayType(h.holidayType);
    setIsActive(h.active);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!holidayName.trim() || !holidayDate) {
      setToast({ message: 'Holiday name and date are required.', type: 'error' });
      return;
    }

    setSubmitting(true);
    const payload = {
      holidayName: holidayName.trim(),
      holidayDate,
      description: description.trim() || null,
      holidayType,
      active: isActive
    };

    try {
      if (editingId) {
        await timesheetService.updateHoliday(editingId, payload);
        setToast({ message: `Holiday "${payload.holidayName}" updated successfully.`, type: 'success' });
      } else {
        await timesheetService.createHoliday(payload);
        setToast({ message: `Holiday "${payload.holidayName}" created successfully.`, type: 'success' });
      }
      resetForm();
      loadHolidays();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || 'Failed to save holiday.';
      setToast({ message: msg, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = async (h) => {
    if (confirm(`Are you sure you want to delete the holiday "${h.holidayName}"?`)) {
      try {
        await timesheetService.deleteHoliday(h.id);
        setToast({ message: `Holiday "${h.holidayName}" deleted successfully.`, type: 'success' });
        if (editingId === h.id) {
          resetForm();
        }
        loadHolidays();
      } catch (err) {
        console.error(err);
        setToast({ message: 'Failed to delete holiday.', type: 'error' });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay backdrop */}
      <div className="absolute inset-0 bg-[#0b0f19]/85 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>

      {/* Card panel */}
      <div className="relative z-10 w-full max-w-4xl bg-[#111111] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-2xl animate-scale-in flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#2A2A2A] flex items-center justify-between">
          <h3 className="text-base font-bold flex items-center gap-2 text-white">
            <Calendar size={18} className="text-[#FF7A00]" />
            <span>Holiday Management</span>
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded transition cursor-pointer" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Content Body - Split Layout */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-5 gap-6">
          
          {/* Left Panel: Holiday Form (2/5 Cols) */}
          <div className="md:col-span-2 flex flex-col gap-4 bg-[#1A1A1A] border border-[#2A2A2A] p-5 rounded-xl h-fit">
            <h4 className="text-xs font-bold text-[#FF7A00] uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <span>{editingId ? 'Edit Holiday' : 'Create New Holiday'}</span>
            </h4>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="holiday-name" className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Holiday Name</label>
                <input
                  id="holiday-name"
                  type="text"
                  required
                  value={holidayName}
                  onChange={(e) => setHolidayName(e.target.value)}
                  placeholder="e.g. Independence Day"
                  className="w-full h-11 bg-[#111111] border border-[#2A2A2A] text-white rounded-xl px-3 text-xs focus:outline-none focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="holiday-date" className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Holiday Date</label>
                <input
                  id="holiday-date"
                  type="date"
                  required
                  value={holidayDate}
                  onChange={(e) => setHolidayDate(e.target.value)}
                  className="w-full h-11 bg-[#111111] border border-[#2A2A2A] text-white rounded-xl px-3 text-xs focus:outline-none focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="holiday-type" className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Holiday Type</label>
                <select
                  id="holiday-type"
                  value={holidayType}
                  onChange={(e) => setHolidayType(e.target.value)}
                  className="w-full h-11 bg-[#111111] border border-[#2A2A2A] text-white rounded-xl px-3 text-xs focus:outline-none focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] transition cursor-pointer"
                >
                  <option value="Public Holiday">Public Holiday</option>
                  <option value="Company Holiday">Company Holiday</option>
                  <option value="Regional Holiday">Regional Holiday</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="holiday-desc" className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Description (Optional)</label>
                <textarea
                  id="holiday-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional details..."
                  rows={2}
                  className="w-full bg-[#111111] border border-[#2A2A2A] text-white rounded-xl p-3 text-xs focus:outline-none focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] transition resize-none"
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  id="holiday-active"
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 accent-[#FF7A00] cursor-pointer rounded"
                />
                <label htmlFor="holiday-active" className="text-xs font-bold text-gray-300 cursor-pointer select-none">
                  Active (Affects attendance calculations)
                </label>
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

          {/* Right Panel: Holiday List Table (3/5 Cols) */}
          <div className="md:col-span-3 flex flex-col gap-4">
            <h4 className="text-xs font-bold text-[#B3B3B3] uppercase tracking-wider">
              Holiday Schedule
            </h4>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <div className="w-6 h-6 border-2 border-[#FF7A00] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Loading holidays...</span>
              </div>
            ) : holidays.length === 0 ? (
              <div className="border border-[#2A2A2A] border-dashed rounded-xl p-8 text-center text-gray-500">
                <AlertTriangle size={24} className="mx-auto text-gray-600 mb-2" />
                <p className="text-xs font-semibold">No company holidays scheduled.</p>
              </div>
            ) : (
              <div className="border border-[#2A2A2A] rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#2A2A2A] bg-black/40 text-[#B3B3B3] uppercase text-[9px] tracking-wider font-bold">
                      <th className="px-4 py-3">Holiday</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2A2A] text-gray-300">
                    {holidays.map((h) => (
                      <tr key={h.id} className="hover:bg-white/[0.01] transition">
                        <td className="px-4 py-3.5 font-bold text-white max-w-[120px] truncate" title={h.holidayName}>
                          {h.holidayName}
                          {h.description && (
                            <span className="block text-[9px] font-normal text-gray-500 truncate">{h.description}</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-mono font-medium text-gray-400">
                          {new Date(h.holidayDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-[10px] font-semibold text-gray-400">
                            {h.holidayType}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-lg border uppercase tracking-wider ${
                            h.active 
                              ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                              : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                          }`}>
                            {h.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEditClick(h)}
                            className="p-1 border border-white/5 hover:border-[#FF7A00] text-gray-400 hover:text-white hover:bg-[#FF7A00]/10 rounded-lg transition cursor-pointer"
                            title="Edit Holiday"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(h)}
                            className="p-1 border border-rose-500/20 hover:border-rose-500 text-rose-400 hover:text-white hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                            title="Delete Holiday"
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

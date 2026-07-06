import { useState, useEffect } from 'react';
import { Settings, Save, ShieldAlert, CheckCircle, RotateCw } from 'lucide-react';
import api from '../services/api';
import Toast from '../components/common/Toast';

export default function CompanySettings() {
  const [settings, setSettings] = useState({
    office_start_time: '09:30',
    office_end_time: '18:30',
    clock_in_grace_period: 30,
    clock_out_grace_period: 0,
    clock_in_reminder_offset: 5,
    clock_out_reminder_offset: 10,
    attendance_recovery_enabled: true,
    recovery_deadline: '23:59',
    weekend_configuration: 'Saturday,Sunday',
    timezone: 'Asia/Kolkata',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Timezones options
  const timezoneOptions = [
    { value: 'Asia/Kolkata', label: 'Indian Standard Time (IST) - Asia/Kolkata' },
    { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
    { value: 'Asia/Singapore', label: 'Singapore Time (SGT) - Asia/Singapore' },
    { value: 'America/New_York', label: 'Eastern Time (EST/EDT) - America/New_York' },
    { value: 'Europe/London', label: 'Greenwich Mean Time (GMT/BST) - Europe/London' },
  ];

  // Weekdays options
  const weekdays = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/settings');
      if (res.data) {
        setSettings(res.data);
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to load company settings.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleWeekendToggle = (day) => {
    const activeWeekends = settings.weekend_configuration ? settings.weekend_configuration.split(',') : [];
    let updatedWeekends = [];
    if (activeWeekends.includes(day)) {
      updatedWeekends = activeWeekends.filter((d) => d !== day);
    } else {
      updatedWeekends = [...activeWeekends, day];
    }
    handleInputChange('weekend_configuration', updatedWeekends.join(','));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/admin/settings', settings);
      setToast({ message: 'Company settings saved successfully!', type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ message: err.response?.data?.error || 'Failed to save settings.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] w-full flex flex-col items-center justify-center gap-3 text-white">
        <RotateCw className="w-8 h-8 text-[#FF7A00] animate-spin" />
        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Loading configurations...</span>
      </div>
    );
  }

  const activeWeekends = settings.weekend_configuration ? settings.weekend_configuration.split(',') : [];

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 animate-fade-in text-white pb-10 px-4">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-[#FF7A00] flex items-center justify-center shadow-lg shadow-[#FF7A00]/5">
            <Settings size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Company Settings</h1>
            <p className="text-xs text-gray-400 font-medium">Configure global office hours, grace periods, and attendance policies.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="flex flex-col gap-6">
        {/* Core Shift Settings */}
        <div className="bg-[#111111] border border-white/5 p-6 rounded-2xl shadow-xl flex flex-col gap-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-orange-500/80 border-b border-white/5 pb-2">Office Shift Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-400">Office Start Time</label>
              <input
                type="time"
                value={settings.office_start_time}
                onChange={(e) => handleInputChange('office_start_time', e.target.value)}
                required
                className="w-full bg-[#1A1A1A] border border-white/5 focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] rounded-xl px-4 py-3 text-sm font-semibold outline-none transition"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-400">Office End Time</label>
              <input
                type="time"
                value={settings.office_end_time}
                onChange={(e) => handleInputChange('office_end_time', e.target.value)}
                required
                className="w-full bg-[#1A1A1A] border border-white/5 focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] rounded-xl px-4 py-3 text-sm font-semibold outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-400">Clock In Grace Period</label>
              <select
                value={settings.clock_in_grace_period}
                onChange={(e) => handleInputChange('clock_in_grace_period', Number(e.target.value))}
                className="w-full bg-[#1A1A1A] border border-white/5 focus:border-[#FF7A00] rounded-xl px-4 py-3 text-sm font-semibold outline-none transition"
              >
                <option value={0}>0 minutes</option>
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
              <span className="text-[10px] text-gray-500 font-medium">Allows clock-in status to remain on time within this grace window.</span>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-400">Clock Out Grace Period</label>
              <select
                value={settings.clock_out_grace_period}
                onChange={(e) => handleInputChange('clock_out_grace_period', Number(e.target.value))}
                className="w-full bg-[#1A1A1A] border border-white/5 focus:border-[#FF7A00] rounded-xl px-4 py-3 text-sm font-semibold outline-none transition"
              >
                <option value={0}>0 minutes</option>
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reminders & Timezone Settings */}
        <div className="bg-[#111111] border border-white/5 p-6 rounded-2xl shadow-xl flex flex-col gap-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-orange-500/80 border-b border-white/5 pb-2">Reminders & Regional Settings</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-400">Clock In Reminder Offset (Minutes Before)</label>
              <select
                value={settings.clock_in_reminder_offset}
                onChange={(e) => handleInputChange('clock_in_reminder_offset', Number(e.target.value))}
                className="w-full bg-[#1A1A1A] border border-white/5 focus:border-[#FF7A00] rounded-xl px-4 py-3 text-sm font-semibold outline-none transition"
              >
                <option value={0}>0 minutes (At Shift Start)</option>
                <option value={5}>5 minutes before</option>
                <option value={10}>10 minutes before</option>
                <option value={15}>15 minutes before</option>
                <option value={20}>20 minutes before</option>
                <option value={30}>30 minutes before</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-400">Clock Out Reminder Offset (Minutes After)</label>
              <select
                value={settings.clock_out_reminder_offset}
                onChange={(e) => handleInputChange('clock_out_reminder_offset', Number(e.target.value))}
                className="w-full bg-[#1A1A1A] border border-white/5 focus:border-[#FF7A00] rounded-xl px-4 py-3 text-sm font-semibold outline-none transition"
              >
                <option value={0}>0 minutes (At Shift End)</option>
                <option value={5}>5 minutes after</option>
                <option value={10}>10 minutes after</option>
                <option value={15}>15 minutes after</option>
                <option value={20}>20 minutes after</option>
                <option value={30}>30 minutes after</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-400">Time Zone</label>
              <select
                value={settings.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                className="w-full bg-[#1A1A1A] border border-white/5 focus:border-[#FF7A00] rounded-xl px-4 py-3 text-sm font-semibold outline-none transition"
              >
                {timezoneOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-400">Weekend Days</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {weekdays.map((day) => {
                  const isWeekend = activeWeekends.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleWeekendToggle(day)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                        isWeekend
                          ? 'bg-[#FF7A00]/10 border-[#FF7A00] text-[#FF7A00]'
                          : 'bg-[#1A1A1A] border-white/5 hover:border-white/10 text-gray-400'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Recovery Settings */}
        <div className="bg-[#111111] border border-white/5 p-6 rounded-2xl shadow-xl flex flex-col gap-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-orange-500/80 border-b border-white/5 pb-2">Forgot Clock Out Recovery Settings</h2>

          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-white">Enable Attendance Recovery Flow</span>
              <span className="text-xs text-gray-400">Allows employees to self-resolve open shifts after shift end.</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.attendance_recovery_enabled}
                onChange={(e) => handleInputChange('attendance_recovery_enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/10 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF7A00]"></div>
            </label>
          </div>

          {settings.attendance_recovery_enabled && (
            <div className="flex flex-col gap-2 max-w-md animate-fade-in">
              <label className="text-xs font-bold text-gray-400">Recovery Submission Deadline</label>
              <input
                type="time"
                value={settings.recovery_deadline}
                onChange={(e) => handleInputChange('recovery_deadline', e.target.value)}
                required
                className="w-full bg-[#1A1A1A] border border-white/5 focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] rounded-xl px-4 py-3 text-sm font-semibold outline-none transition"
              />
              <span className="text-[10px] text-gray-500 font-medium">Submissions for same-day recovery are blocked after this time (typically 11:59 PM).</span>
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3.5 bg-[#FF7A00] hover:bg-[#FF8C1A] text-white rounded-xl text-sm font-bold transition shadow-lg shadow-[#FF7A00]/10 disabled:opacity-50 cursor-pointer"
          >
            {saving ? <RotateCw className="w-4 h-4 animate-spin" /> : <Save size={16} />}
            <span>Save Configurations</span>
          </button>
        </div>
      </form>

      {/* Toast Alert */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

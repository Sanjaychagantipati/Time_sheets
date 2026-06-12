import React, { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { timesheetService } from '../../services/timesheetService';

export default function CreateEmployeeModal({ isOpen, onClose, onSuccess, setToast }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [clientCompany, setClientCompany] = useState('Microsoft');
  const [rate, setRate] = useState('25.00');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await timesheetService.createEmployee({
        name,
        username,
        password,
        role,
        clientCompany,
        rate: parseFloat(rate),
      });

      setToast({ message: `Candidate account created for ${name}`, type: 'success' });
      
      // Reset & Close
      setName('');
      setUsername('');
      setPassword('');
      setRole('employee');
      setClientCompany('Microsoft');
      setRate('25.00');
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setToast({ message: err.message || 'Failed to create candidate.', type: 'error' });
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
            <UserPlus size={16} className="text-indigo-400" />
            <span>Create New Candidate</span>
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded transition" aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 flex flex-col gap-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="bg-[#1a2336] border border-white/5 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. jdoe12"
                  className="bg-[#1a2336] border border-white/5 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="bg-[#1a2336] border border-white/5 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="bg-[#1a2336] border border-white/5 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Client Company</label>
                <select
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
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Hourly Rate ($)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.5"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="e.g. 25.00"
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
              {submitting ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

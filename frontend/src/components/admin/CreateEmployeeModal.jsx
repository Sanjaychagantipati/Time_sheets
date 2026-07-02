import { useState } from 'react';
import { UserPlus, X, Eye, EyeOff } from 'lucide-react';
import { timesheetService } from '../../services/timesheetService';
import { useClientCompanies } from '../../context/ClientCompanyContext';
import Autocomplete from '../Autocomplete';

export default function CreateEmployeeModal({ isOpen, onClose, onSuccess, setToast, onCreateCompanyClick }) {
  const { companies } = useClientCompanies();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('employee');
  const [clientCompany, setClientCompany] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [rate, setRate] = useState('0.00');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const trimmedName = name.trim();
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    const trimmedClientCompany = clientCompany.trim();
    const parsedRate = parseFloat(rate);

    if (!trimmedName) {
      setToast({ message: 'Full Name is required', type: 'error' });
      return;
    }
    if (!trimmedUsername) {
      setToast({ message: 'Username is required', type: 'error' });
      return;
    }
    if (trimmedPassword.length < 6) {
      setToast({ message: 'Password must be at least 6 characters', type: 'error' });
      return;
    }
    if (!trimmedClientCompany) {
      setToast({ message: 'Client Company selection is required', type: 'error' });
      return;
    }
    // No rate validation needed as it is removed from the project

    setSubmitting(true);
    try {
      await timesheetService.createEmployee({
        name: trimmedName,
        username: trimmedUsername,
        password: trimmedPassword,
        role,
        clientCompany: trimmedClientCompany,
        rate: parsedRate,
        currency,
      });

      setToast({ message: `Candidate account created for ${trimmedName}`, type: 'success' });
      
      // Reset & Close
      setName('');
      setUsername('');
      setPassword('');
      setShowPassword(false);
      setRole('employee');
      setClientCompany('');
      setCurrency('USD');
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
      <div className="relative z-10 w-full max-w-lg glass bg-[#121826]/90 border border-white/5 rounded-2xl overflow-visible shadow-2xl animate-scale-in mx-auto">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between rounded-t-2xl bg-[#121826]/90">
          <h3 className="text-base font-bold flex items-center gap-2">
            <UserPlus size={16} className="text-[#FF7A00]" />
            <span>Create New Candidate</span>
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded transition cursor-pointer" aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 flex flex-col gap-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="create-candidate-name" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Full Name</label>
                <input
                  id="create-candidate-name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full h-14 bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl px-4 text-sm focus:outline-none focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] transition"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="create-candidate-username" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Username</label>
                <input
                  id="create-candidate-username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. jdoe12"
                  className="w-full h-14 bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl px-4 text-sm focus:outline-none focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="create-candidate-password" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input
                    id="create-candidate-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full h-14 bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl pl-4 pr-11 text-sm focus:outline-none focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition focus:outline-none cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="create-candidate-role" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</label>
                <select
                  id="create-candidate-role"
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full h-14 bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl px-4 text-sm focus:outline-none focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] transition cursor-pointer"
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Client Company</label>
                {companies.length === 0 ? (
                  <div className="flex flex-col gap-2 p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                    <span className="text-xs text-red-400 font-medium">No client companies available.</span>
                    <span className="text-[11px] text-gray-400">Please create a client company first.</span>
                    <button
                      type="button"
                      onClick={onCreateCompanyClick}
                      className="mt-1 self-start text-xs font-bold text-[#FF7A00] hover:text-[#FF8C1A] transition focus:outline-none cursor-pointer"
                    >
                      + Create Client Company
                    </button>
                  </div>
                ) : (
                  <Autocomplete
                    id="create-candidate-client"
                    placeholder="Search company..."
                    items={companies.map((c) => ({ value: c, label: c }))}
                    selectedValue={clientCompany}
                    onSelect={(val) => setClientCompany(val)}
                  />
                )}
              </div>
              {/* Hourly Rate removed from project */}
            </div>

          </div>

          <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-3 bg-black/10 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-white/10 hover:border-gray-500 text-gray-300 hover:text-white rounded-xl text-sm font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#FF7A00] hover:bg-[#FF8C1A] disabled:bg-[#FF7A00]/50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-[#FF7A00]/20 transition cursor-pointer"
            >
              {submitting ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

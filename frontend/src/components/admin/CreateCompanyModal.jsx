import { useState } from 'react';
import { Briefcase, X, Trash2, Search } from 'lucide-react';
import { useClientCompanies } from '../../context/ClientCompanyContext';

export default function CreateCompanyModal({ isOpen, onClose, employees = [], setToast }) {
  const { companies, addCompany, deleteCompany } = useClientCompanies();
  const [companyName, setCompanyName] = useState('');
  const [listSearchQuery, setListSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = companyName.trim();
    if (!trimmed) {
      setToast({ message: 'Company name is required.', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      addCompany(trimmed);
      setToast({ message: `Client company "${trimmed}" added successfully.`, type: 'success' });
      setCompanyName('');
    } catch (err) {
      console.error(err);
      setToast({ message: err.message || 'Failed to add client company.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (c) => {
    const isAssigned = employees.some(
      (emp) => emp.clientCompany && emp.clientCompany.toLowerCase() === c.toLowerCase()
    );

    if (isAssigned) {
      setToast({
        message: 'This company is assigned to existing employees. Reassign employees before deleting.',
        type: 'error'
      });
      return;
    }

    if (confirm('Are you sure you want to delete this client company?')) {
      try {
        deleteCompany(c);
        setToast({ message: `Client company "${c}" deleted successfully.`, type: 'success' });
      } catch (err) {
        setToast({ message: err.message || 'Failed to delete client company.', type: 'error' });
      }
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
            <Briefcase size={16} className="text-[#FF7A00]" />
            <span>Create Client Company</span>
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded transition cursor-pointer" aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="company-name-input" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Client Company Name</label>
              <input
                id="company-name-input"
                name="companyName"
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. TCS, Accenture, Google"
                className="w-full h-14 bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl px-4 text-sm focus:outline-none focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] transition"
              />
            </div>

            <div className="border-t border-white/5 pt-4">
              {/* Task 3 & 4: Search bar for existing company list */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#B3B3B3] uppercase tracking-wider">Existing Client Companies</h4>
                  <div className="relative w-44">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={listSearchQuery}
                      onChange={(e) => setListSearchQuery(e.target.value)}
                      className="w-full h-8 bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-lg pl-8 pr-3 text-xs focus:outline-none focus:border-[#FF7A00] transition"
                    />
                  </div>
                </div>
                <div className="max-h-36 overflow-y-auto flex flex-col gap-2 pr-1">
                  {companies
                    .filter((c) => c.toLowerCase().includes(listSearchQuery.toLowerCase()))
                    .map((c) => (
                      <div key={c} className="flex items-center justify-between bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-2 transition">
                        <span className="text-white text-sm font-medium">{c}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(c)}
                          className="p-1.5 border border-rose-500/20 hover:border-rose-500 text-rose-400 hover:text-white hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                          title={`Delete ${c}`}
                          aria-label={`Delete ${c}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  {companies.filter((c) => c.toLowerCase().includes(listSearchQuery.toLowerCase())).length === 0 && (
                    <span className="text-xs text-gray-500 italic text-center py-2">No companies found</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-3 bg-black/10">
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
              {submitting ? 'Adding...' : 'Add Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

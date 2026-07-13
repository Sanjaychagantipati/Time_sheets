import React, { useState, useEffect } from 'react';
import { Briefcase, Trash2, Search, Plus } from 'lucide-react';
import { useClientCompanies } from '../context/ClientCompanyContext';
import { timesheetService } from '../services/timesheetService';
import Toast from '../components/common/Toast';

export default function AdminClients() {
  const { companies, addCompany, deleteCompany } = useClientCompanies();
  const [employees, setEmployees] = useState([]);
  const [companyName, setCompanyName] = useState('');
  const [listSearchQuery, setListSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Load employees list to check assignments before deletion
  useEffect(() => {
    async function loadCandidates() {
      try {
        const list = await timesheetService.getEmployeesList();
        setEmployees(list);
      } catch (err) {
        console.error("Failed to load employees for validation:", err);
      }
    }
    loadCandidates();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = companyName.trim();
    if (!trimmed) {
      setToast({ message: 'Company name is required.', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      await addCompany(trimmed);
      setToast({ message: `Client company "${trimmed}" added successfully.`, type: 'success' });
      setCompanyName('');
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.message || 'Failed to add client company.';
      setToast({ message: errMsg, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = async (c) => {
    const isAssigned = employees.some(
      (emp) => emp.clientCompany && emp.clientCompany.toLowerCase() === c.toLowerCase()
    );

    if (isAssigned) {
      setToast({
        message: `Cannot delete "${c}". There are candidates assigned to this company.`,
        type: 'error'
      });
      return;
    }

    if (confirm('Are you sure you want to delete this client company?')) {
      try {
        await deleteCompany(c);
        setToast({ message: `Client company "${c}" deleted successfully.`, type: 'success' });
      } catch (err) {
        console.error(err);
        const errMsg = err.response?.data?.error || err.message || 'Failed to delete client company.';
        setToast({ message: errMsg, type: 'error' });
      }
    }
  };

  const filteredCompanies = companies.filter((c) =>
    c.toLowerCase().includes(listSearchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-white">
      {/* Toast Alert */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Page Header */}
      <div className="border-b border-[#2A2A2A] pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Briefcase className="text-[#FF7A00]" size={24} />
            <span>Client Companies</span>
          </h1>
          <p className="text-xs text-[#B3B3B3] mt-1">
            Configure client corporate entities and associate them with placed candidates.
          </p>
        </div>
        <div className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider py-1 px-3 bg-white/5 rounded-full border border-white/5 w-fit">
          {companies.length} Registered Clients
        </div>
      </div>

      {/* Two Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Create Company Card */}
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-500/90 border-b border-white/5 pb-2">
            <Plus size={14} />
            <span>Add Client Company</span>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="company-name-page" className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Company Name
              </label>
              <input
                id="company-name-page"
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Google, TCS, Deloitte"
                className="w-full h-11 bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl px-4 text-xs focus:outline-none focus:border-[#FF7A00] transition"
              />
            </div>
            
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-[#FF7A00] hover:bg-[#FF8C1A] text-white font-bold text-xs rounded-xl shadow-lg shadow-[#FF7A00]/10 transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Register Company'}
            </button>
          </form>
        </div>

        {/* Existing Companies Directory */}
        <div className="lg:col-span-2 bg-[#111111] border border-[#2A2A2A] rounded-2xl shadow-xl flex flex-col">
          <div className="px-6 py-4.5 border-b border-[#2A2A2A] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-black/20 rounded-t-2xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Briefcase size={14} className="text-[#FF7A00]" />
              <span>Registered Companies Directory</span>
            </h3>

            <div className="relative w-full sm:w-56 shrink-0">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search clients..."
                value={listSearchQuery}
                onChange={(e) => setListSearchQuery(e.target.value)}
                className="w-full h-9 bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl pl-9 pr-3 text-xs outline-none focus:border-[#FF7A00] transition"
              />
            </div>
          </div>

          <div className="p-6">
            {filteredCompanies.length === 0 ? (
              <div className="py-12 text-center text-gray-500 border border-dashed border-[#2A2A2A] rounded-xl">
                <Search size={22} className="mx-auto text-gray-600 mb-2 animate-pulse" />
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  No matching companies found
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCompanies.map((c) => {
                  const candidateCount = employees.filter(
                    (emp) => emp.clientCompany && emp.clientCompany.toLowerCase() === c.toLowerCase()
                  ).length;

                  return (
                    <div
                      key={c}
                      className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl px-5 py-4.5 flex items-center justify-between transition hover:border-[#FF7A00]/20"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">{c}</span>
                        <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">
                          {candidateCount} {candidateCount === 1 ? 'candidate' : 'candidates'} placed
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteClick(c)}
                        className="p-2 border border-rose-500/10 hover:border-rose-500 text-rose-400 hover:text-white hover:bg-rose-500/10 rounded-xl transition cursor-pointer active:scale-95 duration-200"
                        title={`Delete ${c}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

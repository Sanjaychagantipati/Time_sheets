import React, { useState, useEffect, useCallback } from 'react';
import { Users, Trash2, Search, Plus, RotateCw } from 'lucide-react';
import { timesheetService } from '../services/timesheetService';
import CreateEmployeeModal from '../components/admin/CreateEmployeeModal';
import CreateCompanyModal from '../components/admin/CreateCompanyModal';
import Toast from '../components/common/Toast';

export default function AdminCandidates() {
  const [employees, setEmployees] = useState([]);
  const [todayLogs, setTodayLogs] = useState([]);
  const [searchName, setSearchName] = useState('');
  const [filterClient, setFilterClient] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCompanyOpen, setIsCompanyOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [list, logs] = await Promise.all([
        timesheetService.getEmployeesList(),
        timesheetService.getAdminTimesheets({ startDate: todayStr, endDate: todayStr })
      ]);
      setEmployees(list);
      setTodayLogs(logs);
    } catch (err) {
      console.error(err);
      setToast({ message: 'Error retrieving candidates directory.', type: 'error' });
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteEmployee = async (userId, name) => {
    if (confirm(`Delete the candidate account for "${name}"?`)) {
      try {
        await timesheetService.deleteEmployee(userId);
        setToast({ message: `Candidate account for ${name} removed`, type: 'success' });
        loadData(true);
      } catch (err) {
        console.error(err);
        setToast({ message: 'Failed to delete candidate account.', type: 'error' });
      }
    }
  };

  // Get unique clients for filter select dropdown
  const uniqueClients = [...new Set(employees.map(emp => emp.clientCompany).filter(Boolean))].sort();

  // Filter candidates list
  const filteredEmployees = employees.filter(emp => {
    const matchesName = emp.name.toLowerCase().includes(searchName.toLowerCase()) || 
                        emp.username.toLowerCase().includes(searchName.toLowerCase());
    const matchesClient = filterClient === 'all' || emp.clientCompany === filterClient;
    const matchesRole = filterRole === 'all' || emp.role.toLowerCase() === filterRole.toLowerCase();
    return matchesName && matchesClient && matchesRole;
  });

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-white">
      {/* Toast Alert */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Page Header */}
      <div className="border-b border-[#2A2A2A] pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Users className="text-[#FF7A00]" size={24} />
            <span>Staffing Candidates</span>
          </h1>
          <p className="text-xs text-[#B3B3B3] mt-1">
            Manage candidates, create accounts, and assign them to client companies.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData(true)}
            disabled={loading}
            className="p-2.5 border border-white/5 hover:border-[#FF7A00]/50 hover:bg-[#FF7A00]/10 text-gray-400 hover:text-white rounded-xl transition cursor-pointer"
            title="Refresh List"
          >
            <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-[#FF7A00] hover:bg-[#FF8C1A] text-white rounded-xl text-xs font-bold transition shadow-lg shadow-[#FF7A00]/10 cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>

      {/* Filters Form Panel */}
      <div className="bg-[#111111] border border-[#2A2A2A] p-5 rounded-2xl shadow-xl flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
          {/* Candidate Search */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Search Candidate</label>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search by name or username..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full h-11 bg-[#1A1A1A] border border-white/5 text-xs text-white rounded-xl pl-9 pr-3 outline-none focus:border-[#FF7A00] transition"
              />
            </div>
          </div>

          {/* Client Company */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Client Company</label>
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="w-full h-11 bg-[#1A1A1A] border border-white/5 text-xs text-white rounded-xl px-3.5 outline-none focus:border-[#FF7A00] transition cursor-pointer"
            >
              <option value="all">All Clients</option>
              {uniqueClients.map((client) => (
                <option key={client} value={client}>{client}</option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Role Type</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full h-11 bg-[#1A1A1A] border border-white/5 text-xs text-white rounded-xl px-3.5 outline-none focus:border-[#FF7A00] transition cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => {
            setSearchName('');
            setFilterClient('all');
            setFilterRole('all');
          }}
          className="px-4 py-3 border border-white/5 hover:bg-white/5 text-gray-400 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer w-full md:w-auto text-center"
        >
          Reset Filters
        </button>
      </div>

      {/* Directory Table Grid */}
      {loading ? (
        <div className="min-h-[30vh] w-full flex flex-col items-center justify-center gap-3">
          <RotateCw className="w-8 h-8 text-[#FF7A00] animate-spin" />
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Loading directory...</span>
        </div>
      ) : (
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="border-b border-[#2A2A2A] bg-black/40 text-gray-400 uppercase text-[9px] tracking-wider font-bold">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Username</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Client Company</th>
                  <th className="px-6 py-4">Live Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A] text-gray-300">
                {filteredEmployees.map((emp, index) => {
                  const isCurrentlyClockedIn = todayLogs.some(log => log.userId === emp.id && log.clockOut === null);
                  return (
                    <tr key={emp.id} className={`hover:bg-white/[0.01] transition ${index % 2 === 0 ? 'bg-black/10' : ''}`}>
                      <td className="px-6 py-3.5 font-bold text-white">{emp.name}</td>
                      <td className="px-6 py-3.5 font-mono text-xs text-gray-400">{emp.username}</td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-lg border uppercase tracking-wider ${
                          emp.role.toLowerCase() === 'admin'
                            ? 'bg-orange-500/10 text-[#FF7A00] border-orange-500/20'
                            : 'bg-white/5 text-white border-white/10'
                        }`}>
                          {emp.role}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-[#FF7A00]">{emp.clientCompany || 'N/A'}</td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2.5 py-1 text-[9px] font-extrabold rounded-full border uppercase tracking-wider ${
                          isCurrentlyClockedIn 
                            ? 'bg-green-500/10 text-green-400 border-green-500/20 animate-pulse' 
                            : 'bg-transparent text-gray-500 border border-[#2A2A2A]'
                        }`}>
                          {isCurrentlyClockedIn ? 'Clocked In' : 'Off Duty'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                          className="p-1.5 border border-rose-500/20 hover:border-rose-500 hover:bg-rose-500/10 text-rose-400 hover:text-white rounded-xl transition cursor-pointer active:scale-95 duration-200"
                          title="Delete Candidate Account"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">
                      <Users size={22} className="mx-auto text-gray-600 mb-2" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">No candidates found matching criteria.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Creation Modal */}
      <CreateEmployeeModal 
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => loadData(true)}
        setToast={setToast}
        onCreateCompanyClick={() => {
          setIsCreateOpen(false);
          setIsCompanyOpen(true);
        }}
      />

      {/* Company Modal as a backup trigger */}
      <CreateCompanyModal 
        isOpen={isCompanyOpen}
        onClose={() => setIsCompanyOpen(false)}
        employees={employees}
        setToast={setToast}
      />
    </div>
  );
}

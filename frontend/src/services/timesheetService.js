import api, { isMockMode } from './api';
import { getTimesheets, saveTimesheets, getUsers, saveUsers } from './mockDb';

export const timesheetService = {
  // --- EMPLOYEE TIMESHEET FUNCTIONS ---
  getActiveClockIn: async (userId) => {
    if (isMockMode()) {
      const logs = getTimesheets();
      const active = logs.find((t) => t.userId === userId && t.clockOut === null);
      return { hasActive: !!active, log: active || null };
    } else {
      const response = await api.get('/timesheets/active');
      return response.data;
    }
  },

  clockIn: async (userId, locationString) => {
    if (isMockMode()) {
      const logs = getTimesheets();
      const users = getUsers();
      const currentUser = users.find((u) => u.id === userId);
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0];

      const newLog = {
        id: `log-${Date.now()}`,
        userId: userId,
        date: todayStr,
        clockIn: timeStr,
        clockOut: null,
        hours: null,
        notes: '',
        location: locationString,
        clientCompany: currentUser ? currentUser.clientCompany : 'N/A',
        status: 'ACTIVE'
      };

      logs.push(newLog);
      saveTimesheets(logs);
      return { message: 'Clocked in successfully', log: newLog };
    } else {
      const response = await api.post('/timesheets/clock-in', { location: locationString });
      return response.data;
    }
  },

  clockOut: async (activeClockId, notes) => {
    if (isMockMode()) {
      const logs = getTimesheets();
      const logIndex = logs.findIndex((t) => t.id === activeClockId);
      if (logIndex !== -1) {
        const log = logs[logIndex];
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0];

        log.clockOut = timeStr;
        log.notes = notes.trim();
        log.status = 'COMPLETED';

        // Calculate hours
        const inTime = new Date(`${log.date}T${log.clockIn}`);
        const outTime = new Date(`${todayStr}T${timeStr}`);
        let diffHours = (outTime - inTime) / 3600000;
        if (diffHours < 0) diffHours = 0;
        log.hours = parseFloat(diffHours.toFixed(2));

        logs[logIndex] = log;
        saveTimesheets(logs);
        return { message: 'Clocked out successfully', log };
      }
      throw new Error('Active clock session not found');
    } else {
      const response = await api.post('/timesheets/clock-out', { notes });
      return response.data;
    }
  },

  getMyLogs: async (userId) => {
    if (isMockMode()) {
      const logs = getTimesheets();
      return logs
        .filter((t) => t.userId === userId)
        .sort((a, b) => new Date(b.date + 'T' + b.clockIn) - new Date(a.date + 'T' + a.clockIn));
    } else {
      const response = await api.get('/timesheets/my-logs');
      return response.data;
    }
  },

  // --- ADMIN TIMESHEET & MANAGEMENT FUNCTIONS ---
  getAdminStats: async () => {
    if (isMockMode()) {
      const logs = getTimesheets();
      const users = getUsers();
      const employees = users.filter((u) => u.role === 'employee');

      const activeClockins = logs.filter((t) => t.clockOut === null).length;
      const uniqueClients = [...new Set(employees.map((e) => e.clientCompany))].filter(Boolean);

      const todayStr = new Date().toISOString().split('T')[0];
      const todaysHours = logs
        .filter((t) => t.date === todayStr && t.clockOut !== null)
        .reduce((sum, current) => sum + (current.hours || 0), 0);

      return {
        currentlyClockedIn: activeClockins,
        activeEmployees: activeClockins,
        totalEmployees: employees.length,
        activeClients: uniqueClients.length,
        totalClients: uniqueClients.length,
        todaysHours: parseFloat(todaysHours.toFixed(2))
      };
    } else {
      const response = await api.get('/admin/stats');
      return response.data;
    }
  },

  getAdminTimesheets: async (filters = {}) => {
    if (isMockMode()) {
      const logs = getTimesheets();
      let filtered = [...logs];

      if (filters.userId && filters.userId !== 'all') {
        filtered = filtered.filter((t) => t.userId === filters.userId);
      }
      if (filters.client && filters.client !== 'all') {
        filtered = filtered.filter((t) => t.clientCompany === filters.client);
      }
      if (filters.startDate) {
        filtered = filtered.filter((t) => t.date >= filters.startDate);
      }
      if (filters.endDate) {
        filtered = filtered.filter((t) => t.date <= filters.endDate);
      }

      // Sort newest first
      filtered.sort((a, b) => new Date(b.date + 'T' + b.clockIn) - new Date(a.date + 'T' + a.clockIn));
      return filtered;
    } else {
      const response = await api.get('/admin/timesheets', { params: filters });
      return response.data;
    }
  },

  createManualLog: async (logEntry) => {
    if (isMockMode()) {
      const logs = getTimesheets();
      const users = getUsers();
      const employee = users.find((u) => u.id === logEntry.userId);

      let hours = null;
      if (logEntry.clockOut) {
        const inTime = new Date(`${logEntry.date}T${logEntry.clockIn}`);
        const outTime = new Date(`${logEntry.date}T${logEntry.clockOut}`);
        let diffHours = (outTime - inTime) / 3600000;
        if (diffHours < 0) diffHours = 0;
        hours = parseFloat(diffHours.toFixed(2));
      }

      const newLog = {
        id: `log-${Date.now()}`,
        userId: logEntry.userId,
        date: logEntry.date,
        clockIn: logEntry.clockIn,
        clockOut: logEntry.clockOut,
        hours: hours,
        notes: logEntry.notes,
        location: logEntry.location || 'Office (Manual)',
        clientCompany: employee ? employee.clientCompany : 'N/A',
        status: logEntry.clockOut ? 'COMPLETED' : 'ACTIVE'
      };

      logs.push(newLog);
      saveTimesheets(logs);
      return { message: 'Manual entry created', id: newLog.id };
    } else {
      const response = await api.post('/admin/timesheets', logEntry);
      return response.data;
    }
  },

  updateLog: async (logId, logEntry) => {
    if (isMockMode()) {
      const logs = getTimesheets();
      const index = logs.findIndex((t) => t.id === logId);
      if (index !== -1) {
        let hours = null;
        if (logEntry.clockOut) {
          const inTime = new Date(`${logEntry.date}T${logEntry.clockIn}`);
          const outTime = new Date(`${logEntry.date}T${logEntry.clockOut}`);
          let diffHours = (outTime - inTime) / 3600000;
          if (diffHours < 0) diffHours = 0;
          hours = parseFloat(diffHours.toFixed(2));
        }

        logs[index] = {
          ...logs[index],
          ...logEntry,
          hours,
          status: logEntry.clockOut ? 'COMPLETED' : 'ACTIVE'
        };
        saveTimesheets(logs);
        return { message: 'Timesheet record updated' };
      }
      throw new Error('Timesheet entry not found');
    } else {
      const response = await api.put(`/admin/timesheets/${logId}`, logEntry);
      return response.data;
    }
  },

  deleteLog: async (logId) => {
    if (isMockMode()) {
      const logs = getTimesheets();
      const filtered = logs.filter((t) => t.id !== logId);
      saveTimesheets(filtered);
      return { message: 'Timesheet record deleted' };
    } else {
      const response = await api.delete(`/admin/timesheets/${logId}`);
      return response.data;
    }
  },

  createEmployee: async (employeeData) => {
    if (isMockMode()) {
      const users = getUsers();
      const userExists = users.find((u) => u.username === employeeData.username);
      if (userExists) {
        throw new Error('Username already taken');
      }

      const newUser = {
        id: `u-${Date.now()}`,
        name: employeeData.name,
        username: employeeData.username,
        password: employeeData.password,
        role: employeeData.role || 'employee',
        clientCompany: employeeData.clientCompany,
        rate: parseFloat(employeeData.rate || 0)
      };

      users.push(newUser);
      saveUsers(users);
      return { message: 'User account created successfully', userId: newUser.id };
    } else {
      const response = await api.post('/admin/users', employeeData);
      return response.data;
    }
  },

  getEmployeesList: async () => {
    if (isMockMode()) {
      const users = getUsers();
      return users.filter((u) => u.role === 'employee');
    } else {
      const response = await api.get('/admin/employees');
      return response.data;
    }
  },

  // --- CSV REPORTS & EXPORTS ---
  exportMasterCSV: async (filters = {}) => {
    if (isMockMode()) {
      const timesheets = getTimesheets();
      const users = getUsers();
      let filtered = [...timesheets];

      if (filters.userId && filters.userId !== 'all') {
        filtered = filtered.filter((t) => t.userId === filters.userId);
      }
      if (filters.client && filters.client !== 'all') {
        filtered = filtered.filter((t) => t.clientCompany === filters.client);
      }
      if (filters.startDate) {
        filtered = filtered.filter((t) => t.date >= filters.startDate);
      }
      if (filters.endDate) {
        filtered = filtered.filter((t) => t.date <= filters.endDate);
      }

      let csv = 'Candidate Name,Client Company,Hourly Rate ($),Date,Clock In,Clock Out,Total Hours,Location Captured,Work Notes\n';
      filtered.forEach((log) => {
        const user = users.find((u) => u.id === log.userId) || { name: 'Unknown', rate: 0 };
        const cleanNotes = log.notes ? `"${log.notes.replace(/"/g, '""')}"` : '""';
        const cleanLocation = log.location ? `"${log.location.replace(/"/g, '""')}"` : '""';
        const hoursStr = log.clockOut ? log.hours : 'Active Clock';
        const clockOutTime = log.clockOut || 'N/A';
        csv += `"${user.name}","${log.clientCompany || 'N/A'}",${user.rate},"${log.date}","${log.clockIn}","${clockOutTime}",${hoursStr},${cleanLocation},${cleanNotes}\n`;
      });

      triggerFileDownload(csv, `Vergil_Tempo_Timesheets_${new Date().toISOString().slice(0, 10)}.csv`);
      return true;
    } else {
      // Stream server-side CSV response
      const response = await api.get('/reports/export-master', { params: filters, responseType: 'blob' });
      triggerBlobDownload(response.data, `Vergil_Tempo_Timesheets_${new Date().toISOString().slice(0, 10)}.csv`);
      return true;
    }
  },

  exportMonthlyBillingReport: async (userId, yearMonth) => {
    if (isMockMode()) {
      const timesheets = getTimesheets();
      const users = getUsers();
      const candidate = users.find((u) => u.id === userId);
      if (!candidate) throw new Error('Candidate not found');

      const monthlyLogs = timesheets
        .filter((t) => t.userId === userId && t.date.startsWith(yearMonth) && t.clockOut !== null)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      if (monthlyLogs.length === 0) {
        throw new Error(`No logged hours found for this candidate in the selected month`);
      }

      const totalHours = monthlyLogs.reduce((sum, log) => sum + log.hours, 0);
      const totalBillable = totalHours * (candidate.rate || 0);

      const parts = yearMonth.split('-');
      const labelDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
      const monthLabel = labelDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      let csv = `VERGIL TEMPO STAFFING AGENCY - CANDIDATE BILLING REPORT\n`;
      csv += `Candidate Name,"${candidate.name}"\n`;
      csv += `Billing Month,"${monthLabel}"\n`;
      csv += `Placed Client Company,"${candidate.clientCompany || 'N/A'}"\n`;
      csv += `Payroll Hourly Rate,$${(candidate.rate || 0).toFixed(2)}\n\n`;
      csv += `Date,Clock In,Clock Out,Total Hours,Location Captured,Work Notes\n`;

      monthlyLogs.forEach((log) => {
        const cleanNotes = log.notes ? `"${log.notes.replace(/"/g, '""')}"` : '""';
        const cleanLocation = log.location ? `"${log.location.replace(/"/g, '""')}"` : '""';
        csv += `"${log.date}","${log.clockIn}","${log.clockOut}",${log.hours.toFixed(2)},${cleanLocation},${cleanNotes}\n`;
      });

      csv += `\n`;
      csv += `TOTAL BILLABLE HOURS,,,${totalHours.toFixed(2)}\n`;
      csv += `TOTAL BILLABLE AMOUNT,,, "$${totalBillable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}"\n`;

      triggerFileDownload(csv, `Vergil_Tempo_${candidate.name.replace(/\s+/g, '_')}_${yearMonth}.csv`);
      return true;
    } else {
      // Call server endpoint streaming PDF or Excel (using OpenPDF / Apache POI)
      const response = await api.get('/reports/export-monthly', {
        params: { userId, month: yearMonth },
        responseType: 'blob'
      });
      triggerBlobDownload(response.data, `Vergil_Tempo_Billing_${userId}_${yearMonth}.csv`);
      return true;
    }
  }
};

// Helpers to initiate downloads
function triggerFileDownload(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  triggerBlobDownload(blob, filename);
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

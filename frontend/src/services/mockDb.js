// --- VERGIL TEMPO LOCAL MOCK DATABASE LAYER ---

const SEED_USERS = [
  { id: 'u-admin', name: 'Staffing Manager', username: 'admin', password: 'admin123', role: 'admin', clientCompany: 'Operations', rate: 50 },
  { id: 'u-emp1', name: 'John Doe', username: 'employee1', password: 'emp123', role: 'employee', clientCompany: 'Microsoft', rate: 35 },
  { id: 'u-emp2', name: 'Jane Smith', username: 'employee2', password: 'emp123', role: 'employee', clientCompany: 'Google', rate: 30 },
  { id: 'u-emp3', name: 'David Lee', username: 'dlee', password: 'emp123', role: 'employee', clientCompany: 'Microsoft', rate: 40 },
  { id: 'u-emp4', name: 'Sarah Connor', username: 'sconnor', password: 'emp123', role: 'employee', clientCompany: 'Meta', rate: 28 },
  { id: 'u-emp5', name: 'Alex Rivera', username: 'arivera', password: 'emp123', role: 'employee', clientCompany: 'Amazon', rate: 25 }
];

function generateSeedTimesheets() {
  const logs = [];
  const users = SEED_USERS.filter(u => u.role === 'employee');
  const now = new Date();
  
  // Generate records for the last 6 days
  for (let i = 6; i >= 1; i--) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    const dateString = date.toISOString().split('T')[0];

    users.forEach((emp, index) => {
      if ((index + i) % 5 === 0) return; // random skip

      const checkInHour = 8 + (index % 2); 
      const checkInMinute = 15 * (index % 4);
      const workedHours = 8 + (index % 2) * 0.5 + (i % 2) * 0.25; 
      const checkOutHour = checkInHour + Math.floor(workedHours);
      const checkOutMinute = checkInMinute + Math.round((workedHours % 1) * 60);

      const inTime = `${String(checkInHour).padStart(2, '0')}:${String(checkInMinute).padStart(2, '0')}:00`;
      const outTime = `${String(checkOutHour).padStart(2, '0')}:${String(checkOutMinute).padStart(2, '0')}:00`;

      const noteSamples = [
        'Working on project codebase optimization.',
        'Wireframes design and review feedback integration.',
        'Engineering standup and server setup.',
        'Client presentation planning & deck revision.',
        'Resolving layout issues on checkout flows.'
      ];
      const note = noteSamples[(index + i) % noteSamples.length];
      const locations = ['Remote (Boston Office)', 'Remote (Home Office)', 'HQ - Conference Room B', 'Co-working Space'];
      const location = locations[(index + i) % locations.length];

      logs.push({
        id: `log-${Date.now()}-${index}-${i}`,
        userId: emp.id,
        date: dateString,
        clockIn: inTime,
        clockOut: outTime,
        hours: workedHours,
        notes: note,
        location: location,
        clientCompany: emp.clientCompany,
        status: 'COMPLETED'
      });
    });
  }
  
  // Add active clock-in for John Doe (for demo purposes)
  const todayStr = now.toISOString().split('T')[0];
  logs.push({
    id: 'log-active-demo',
    userId: 'u-emp1',
    date: todayStr,
    clockIn: '09:00:00',
    clockOut: null,
    hours: null,
    notes: '',
    location: 'HQ - Main Office',
    clientCompany: 'Microsoft',
    status: 'ACTIVE'
  });

  return logs;
}

import { getStoredUsers, getStoredTimesheets, saveStoredTimesheets, initDb } from '../data/mockData';

// Initialize LocalStorage Database if not exists
export function initMockDb() {
  initDb();
}

export function getUsers() {
  return getStoredUsers();
}

export function saveUsers(users) {
  localStorage.setItem('vt_users', JSON.stringify(users));
}

export function getTimesheets() {
  return getStoredTimesheets();
}

export function saveTimesheets(timesheets) {
  saveStoredTimesheets(timesheets);
}

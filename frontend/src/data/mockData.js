// --- VERGIL TEMPO CENTRALIZED MOCK DATA LAYER ---

export const users = [
  {
    id: 1,
    username: "admin",
    password: "admin123",
    role: "ADMIN",
    name: "System Administrator"
  },
  {
    id: 2,
    username: "employee",
    password: "emp123",
    role: "EMPLOYEE",
    name: "John Doe",
    clientCompany: "Microsoft",
    rate: 35
  },
  {
    id: 3,
    username: "employee2",
    password: "emp123",
    role: "EMPLOYEE",
    name: "Jane Smith",
    clientCompany: "Google",
    rate: 30
  },
  {
    id: 4,
    username: "employee3",
    password: "emp123",
    role: "EMPLOYEE",
    name: "Sarah Connor",
    clientCompany: "Meta",
    rate: 28
  }
];

export const clients = [
  { id: 1, name: "Microsoft" },
  { id: 2, name: "Google" },
  { id: 3, name: "Meta" },
  { id: 4, name: "Amazon" },
  { id: 5, name: "Netflix" }
];

// Seed initial mock timesheets if not present in localStorage
const generateSeedTimesheets = () => {
  const seedLogs = [];
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Past logs
  seedLogs.push({
    id: "ts-001",
    userId: 2,
    employeeName: "John Doe",
    client: "Microsoft",
    date: "2026-06-11",
    clockIn: "09:00:00",
    clockOut: "17:15:00",
    hours: 8.25,
    notes: "Employee dashboard implementation",
    status: "COMPLETED",
    location: "Remote (Home Office)",
    clientCompany: "Microsoft"
  });

  seedLogs.push({
    id: "ts-002",
    userId: 3,
    employeeName: "Jane Smith",
    client: "Google",
    date: "2026-06-11",
    clockIn: "10:00:00",
    clockOut: "18:00:00",
    hours: 8.00,
    notes: "Vite config and rebrand changes",
    status: "COMPLETED",
    location: "Remote (Google HQ)",
    clientCompany: "Google"
  });

  // Active shift for John Doe today
  seedLogs.push({
    id: "ts-active-demo",
    userId: 2,
    employeeName: "John Doe",
    client: "Microsoft",
    date: todayStr,
    clockIn: "09:00:00",
    clockOut: null,
    hours: null,
    notes: "",
    status: "ACTIVE",
    location: "HQ - Main Office",
    clientCompany: "Microsoft"
  });

  return seedLogs;
};

// Initialize localStorage databases
export const initDb = () => {
  if (!localStorage.getItem('vt_users')) {
    localStorage.setItem('vt_users', JSON.stringify(users));
  }
  if (!localStorage.getItem('vt_timesheets')) {
    localStorage.setItem('vt_timesheets', JSON.stringify(generateSeedTimesheets()));
  }
};

// Functions to query/write data (interacting with localStorage for persistence)
export const getStoredUsers = () => {
  initDb();
  return JSON.parse(localStorage.getItem('vt_users'));
};

export const getStoredTimesheets = () => {
  initDb();
  return JSON.parse(localStorage.getItem('vt_timesheets'));
};

export const saveStoredTimesheets = (sheets) => {
  localStorage.setItem('vt_timesheets', JSON.stringify(sheets));
};

// Derived stats helper functions
export const getTotalEmployees = () => {
  const allUsers = getStoredUsers();
  return allUsers.filter(u => u.role === 'EMPLOYEE').length;
};

export const getActiveEmployees = () => {
  const sheets = getStoredTimesheets();
  return sheets.filter(s => s.status === 'ACTIVE').length;
};

export const getTotalClients = () => {
  return clients.length;
};

export const getTodaysHours = () => {
  const sheets = getStoredTimesheets();
  const todayStr = new Date().toISOString().split('T')[0];
  return sheets
    .filter(s => s.date === todayStr && s.status === 'COMPLETED')
    .reduce((sum, curr) => sum + (curr.hours || 0), 0);
};

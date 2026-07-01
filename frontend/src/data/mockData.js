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

export const initialHolidays = [
  {
    id: "h1",
    holidayName: "New Year's Day",
    holidayDate: "2026-01-01",
    description: "Beginning of the civil year",
    holidayType: "Public Holiday",
    active: true
  },
  {
    id: "h2",
    holidayName: "Independence Day",
    holidayDate: "2026-08-15",
    description: "National Independence Day anniversary",
    holidayType: "Public Holiday",
    active: true
  }
];

// Seed initial mock timesheets if not present in localStorage
const generateSeedTimesheets = () => {
  return [];
};

// Initialize localStorage databases
export const initDb = () => {
  if (!localStorage.getItem('vt_users')) {
    localStorage.setItem('vt_users', JSON.stringify(users));
  }
  if (!localStorage.getItem('vt_timesheets')) {
    localStorage.setItem('vt_timesheets', JSON.stringify(generateSeedTimesheets()));
  }
  if (!localStorage.getItem('vt_holidays')) {
    localStorage.setItem('vt_holidays', JSON.stringify(initialHolidays));
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

export const getStoredHolidays = () => {
  initDb();
  return JSON.parse(localStorage.getItem('vt_holidays') || '[]');
};

export const saveStoredHolidays = (holidays) => {
  localStorage.setItem('vt_holidays', JSON.stringify(holidays));
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

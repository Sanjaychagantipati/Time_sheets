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
  return [];
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

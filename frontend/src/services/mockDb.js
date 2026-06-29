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

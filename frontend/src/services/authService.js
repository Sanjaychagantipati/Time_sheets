import api, { isMockMode } from './api';
import { getStoredUsers } from '../data/mockData';

export const authService = {
  login: async (username, password) => {
    const trimmedUsername = username.toLowerCase().trim();
    
    if (isMockMode()) {
      // Simulate backend authentication delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const users = getStoredUsers();
      const user = users.find(
        (u) => u.username.toLowerCase() === trimmedUsername && u.password === password
      );

      if (user) {
        const mockToken = `mock-jwt-token-for-${user.id}`;
        const userData = {
          ...user,
          token: mockToken
        };
        localStorage.setItem('vt_token', mockToken);
        localStorage.setItem('vt_user', JSON.stringify(userData));
        return { token: mockToken, user: userData };
      } else {
        throw new Error('Invalid username or password');
      }
    } else {
      const response = await api.post('/auth/login', { username, password });
      const { token, user } = response.data;
      localStorage.setItem('vt_token', token);
      localStorage.setItem('vt_user', JSON.stringify(user));
      return { token, user };
    }
  },

  logout: () => {
    localStorage.removeItem('vt_token');
    localStorage.removeItem('vt_user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('vt_user');
    return userStr ? JSON.parse(userStr) : null;
  }
};

export const clearAuthCredentials = () => {
  localStorage.removeItem('vt_token');
  localStorage.removeItem('vt_user');
};

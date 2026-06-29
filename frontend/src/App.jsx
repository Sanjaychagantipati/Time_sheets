import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ClientCompanyProvider } from './context/ClientCompanyContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <AuthProvider>
      <ClientCompanyProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ClientCompanyProvider>
    </AuthProvider>
  );
}

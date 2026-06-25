import React, { createContext, useState, useEffect, useContext } from 'react';
import api, { isMockMode } from '../services/api';
import { useAuth } from './AuthContext';

export const ClientCompanyContext = createContext(null);

const DEFAULT_COMPANIES = ['Microsoft', 'Google', 'Meta', 'Amazon', 'Netflix'];

export const ClientCompanyProvider = ({ children }) => {
  const [companies, setCompanies] = useState([]);
  const { isAuthenticated, user } = useAuth();

  // Load companies on mount
  useEffect(() => {
    if (isMockMode()) {
      const stored = localStorage.getItem('vt_client_companies');
      if (stored) {
        try {
          setCompanies(JSON.parse(stored));
        } catch (err) {
          console.error("Failed to parse stored client companies", err);
          setCompanies(DEFAULT_COMPANIES);
          localStorage.setItem('vt_client_companies', JSON.stringify(DEFAULT_COMPANIES));
        }
      } else {
        setCompanies(DEFAULT_COMPANIES);
        localStorage.setItem('vt_client_companies', JSON.stringify(DEFAULT_COMPANIES));
      }
    } else {
      if (isAuthenticated && user && (user.role === 'admin' || user.role === 'ADMIN')) {
        async function loadCompanies() {
          try {
            const response = await api.get('/clients');
            const names = response.data.map(c => c.name);
            setCompanies(names);
            localStorage.setItem('vt_client_companies', JSON.stringify(names));
          } catch (err) {
            console.error("Failed to load client companies from API", err);
          }
        }
        loadCompanies();
      }
    }
  }, [isAuthenticated, user]);

  const addCompany = async (companyName) => {
    const trimmed = companyName.trim();
    if (!trimmed) {
      throw new Error('Company name cannot be empty');
    }
    
    // Check duplicates case-insensitively
    const exists = companies.some(
      (c) => c.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      throw new Error(`Company "${trimmed}" already exists`);
    }

    if (isMockMode()) {
      const updated = [...companies, trimmed];
      setCompanies(updated);
      localStorage.setItem('vt_client_companies', JSON.stringify(updated));
    } else {
      const response = await api.post('/clients', { name: trimmed });
      const newClient = response.data;
      const updated = [...companies, newClient.name];
      setCompanies(updated);
      localStorage.setItem('vt_client_companies', JSON.stringify(updated));
    }
  };

  const deleteCompany = async (companyName) => {
    if (isMockMode()) {
      const updated = companies.filter(c => c !== companyName);
      setCompanies(updated);
      localStorage.setItem('vt_client_companies', JSON.stringify(updated));
    } else {
      await api.delete('/clients', { params: { name: companyName } });
      const updated = companies.filter(c => c !== companyName);
      setCompanies(updated);
      localStorage.setItem('vt_client_companies', JSON.stringify(updated));
    }
  };

  return (
    <ClientCompanyContext.Provider
      value={{
        companies,
        addCompany,
        deleteCompany
      }}
    >
      {children}
    </ClientCompanyContext.Provider>
  );
};

export const useClientCompanies = () => {
  const context = useContext(ClientCompanyContext);
  if (!context) {
    throw new Error('useClientCompanies must be used within a ClientCompanyProvider');
  }
  return context;
};

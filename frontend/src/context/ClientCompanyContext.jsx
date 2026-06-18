import React, { createContext, useState, useEffect, useContext } from 'react';

export const ClientCompanyContext = createContext(null);

const DEFAULT_COMPANIES = ['Microsoft', 'Google', 'Meta', 'Amazon', 'Netflix'];

export const ClientCompanyProvider = ({ children }) => {
  const [companies, setCompanies] = useState([]);

  // Load companies on mount
  useEffect(() => {
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
  }, []);

  const addCompany = (companyName) => {
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

    const updated = [...companies, trimmed];
    setCompanies(updated);
    localStorage.setItem('vt_client_companies', JSON.stringify(updated));
  };

  const deleteCompany = (companyName) => {
    const updated = companies.filter(c => c !== companyName);
    setCompanies(updated);
    localStorage.setItem('vt_client_companies', JSON.stringify(updated));
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

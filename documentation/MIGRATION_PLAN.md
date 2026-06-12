# FRONTEND MIGRATION PLAN: React & Tailwind CSS

This document outlines the step-by-step process for migrating the static HTML/CSS/JS frontend of Vergil Tempo into a modern, modular React SPA utilizing Tailwind CSS, React Router, and Axios.

---

## 1. Step-by-Step Migration Process

### Step 1.1: Project Initialization
1.  Initialize a new React app with Vite:
    ```bash
    npm create vite@latest vergil-tempo -- --template react
    cd vergil-tempo
    ```
2.  Install required routing, icon, HTTP, and chart libraries:
    ```bash
    npm install react-router-dom axios lucide-react chart.js react-chartjs-2
    ```
3.  Install Tailwind CSS, PostCSS, and Autoprefixer:
    ```bash
    npm install -D tailwindcss postcss autoprefixer
    npx tailwindcss init -p
    ```

### Step 1.2: Configure Tailwind CSS Theme
To match Vergil Tempo's premium dark aesthetics, map the variables in the original [styles.css](file:///c:/Users/chagantipati%20sanjay/Time_sheets/styles.css) into `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // supports .dark class
  theme: {
    extend: {
      colors: {
        bgPrimary: '#0b0f19',
        bgSecondary: '#121826',
        bgTertiary: '#1a2336',
        accentColor: '#6366f1',
        accentHover: '#4f46e5',
        successColor: '#10b981',
        successHover: '#059669',
        dangerColor: '#f43f5e',
        dangerHover: '#e11d48',
        warningColor: '#f59e0b',
        infoColor: '#0ea5e9',
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

### Step 1.3: Define Recommended React Folder Structure
Organize your `src/` directory to modularize pages, services, layouts, contexts, and components:

```text
src/
├── assets/             # Images, logos, static SVGs
├── components/         # Shared, reusable UI widgets
│   ├── ui/             # Buttons, inputs, inputs with icons, cards
│   ├── modals/         # CreateEmployeeModal, EditLogModal, MonthlyDownloadModal
│   ├── ClockCard.jsx   # Live clock ticking component
│   └── LogsTable.jsx   # Tabular shift histories
│
├── context/
│   └── AuthContext.jsx # Global auth session (JWT store, Login/Logout methods)
│
├── layouts/
│   └── MainLayout.jsx  # Main shell containing Navbar and responsive nav drawers
│
├── pages/
│   ├── LoginPage.jsx   # SignIn UI panel
│   ├── EmployeePage.jsx# Clock Portal & personal shift table
│   └── AdminPage.jsx   # Statistics overview, chart, and master filter list
│
├── routes/
│   ├── AppRoutes.jsx   # Routing declarations
│   └── ProtectedRoute.jsx # HOC blocking unauthenticated users and checking roles
│
├── services/
│   ├── api.js          # Axios base configuration & interceptor middleware
│   ├── authService.js  # Server auth triggers
│   └── timesheetService.js # Clock-in/out, logs fetching, and CSV triggers
│
├── utils/
│   └── formatters.js   # Date conversion & 12h time formatting helpers
│
├── App.jsx             # Main App Shell
├── index.css           # Global base styling imports (@tailwind directives)
└── main.jsx            # DOM compiler mount point
```

---

## 2. Reusable React Component Translations

Below are code implementation drafts illustrating how to convert the vanilla HTML, CSS, and JS components from [index.html](file:///c:/Users/chagantipati%20sanjay/Time_sheets/index.html) and [app.js](file:///c:/Users/chagantipati%20sanjay/Time_sheets/app.js) into React + Tailwind components.

### 2.1 Service Layer Setup: `src/services/api.js`
Replaces raw localStorage session checks with configured Axios request interceptors that inject JWT tokens:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT Bearer token into headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cf_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Redirect to login if token expires (401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('cf_token');
      localStorage.removeItem('cf_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 2.2 Global Auth State Provider: `src/context/AuthContext.jsx`
Manages login and logout actions globally:

```javascript
import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('cf_user');
    const token = localStorage.getItem('cf_token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    const { token, user: loggedUser } = response.data;
    localStorage.setItem('cf_token', token);
    localStorage.setItem('cf_user', JSON.stringify(loggedUser));
    setUser(loggedUser);
    return loggedUser;
  };

  const logout = () => {
    localStorage.removeItem('cf_token');
    localStorage.removeItem('cf_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 2.3 Clock Card Component: `src/components/ClockCard.jsx`
Translates [handleClockAction](file:///c:/Users/chagantipati%20sanjay/Time_sheets/app.js#L536-L601) and [startClockTicker](file:///c:/Users/chagantipati%20sanjay/Time_sheets/app.js#L443-L468) into a stateful, interactive component:

```jsx
import React, { useState, useEffect } from 'react';
import { Play, Square, MapPin } from 'lucide-react';
import api from '../services/api';

export default function ClockCard({ onShiftLogged }) {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [activeLog, setActiveLog] = useState(null);
  const [timeStr, setTimeStr] = useState('00:00:00');
  const [dateStr, setDateStr] = useState('');
  const [notes, setNotes] = useState('');
  const [locationStr, setLocationStr] = useState('');
  const [detecting, setDetecting] = useState(false);

  // Check active clock state on mount
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await api.get('/timesheets/active');
        if (res.data.hasActive) {
          setIsClockedIn(true);
          setActiveLog(res.data.log);
          setLocationStr(res.data.log.location);
        }
      } catch (err) {
        console.error("Error checking active session", err);
      }
    }
    checkStatus();
  }, []);

  // Update Ticker / Calendar text
  useEffect(() => {
    let interval = null;
    
    if (isClockedIn && activeLog) {
      // Calculate elapsed time from clockIn
      const startDateTime = new Date(`${activeLog.date}T${activeLog.clockIn}`);
      interval = setInterval(() => {
        const elapsedMs = new Date() - startDateTime;
        if (elapsedMs < 0) {
          setTimeStr('00:00:00');
        } else {
          const hours = Math.floor(elapsedMs / 3600000);
          const minutes = Math.floor((elapsedMs % 3600000) / 60000);
          const seconds = Math.floor((elapsedMs % 60000) / 1000);
          setTimeStr(
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
          );
        }
      }, 1000);
    } else {
      // Standard Live clock display
      interval = setInterval(() => {
        const now = new Date();
        setTimeStr(now.toTimeString().split(' ')[0]);
        setDateStr(now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isClockedIn, activeLog]);

  const handleClockIn = async () => {
    setDetecting(true);
    let coordsText = "Simulated Location";
    
    if ("geolocation" in navigator) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        coordsText = `Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`;
      } catch (err) {
        coordsText = "Location Denied (Home Office)";
      }
    }
    
    try {
      const res = await api.post('/timesheets/clock-in', { location: coordsText });
      setIsClockedIn(true);
      setActiveLog(res.data.log);
      setLocationStr(coordsText);
      setDetecting(false);
    } catch (err) {
      console.error(err);
      setDetecting(false);
    }
  };

  const handleClockOut = async () => {
    try {
      await api.post('/timesheets/clock-out', { notes });
      setIsClockedIn(false);
      setActiveLog(null);
      setNotes('');
      setLocationStr('');
      if (onShiftLogged) onShiftLogged();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="card glass hero-gradient p-10 flex flex-col items-center justify-center rounded-2xl relative overflow-hidden text-center bg-slate-900/60 border border-white/10 shadow-xl">
      <div className="relative z-10 mb-4">
        <div className="text-5xl font-extrabold tracking-tight text-white font-mono">{timeStr}</div>
        <div className="text-md text-gray-400 font-medium mt-2">{dateStr}</div>
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 relative z-10">
        <span className={`w-2 h-2 rounded-full ${isClockedIn ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'}`}></span>
        <span className="text-xs font-semibold text-white uppercase tracking-wider">
          {isClockedIn ? 'Clocked In' : 'Clocked Out'}
        </span>
      </div>

      <div className="w-full max-w-md relative z-10">
        {isClockedIn && (
          <div className="mb-4 flex flex-col gap-2">
            <label className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
              What are you working on? (Optional)
            </label>
            <textarea
              className="bg-slate-800 border border-white/5 text-white rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter task summary..."
              rows={2}
            />
            {locationStr && (
              <div className="flex items-center justify-center gap-1.5 p-2 rounded bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs mt-2">
                <MapPin size={14} />
                <span>{locationStr}</span>
              </div>
            )}
          </div>
        )}

        <button
          onClick={isClockedIn ? handleClockOut : handleClockIn}
          disabled={detecting}
          className={`w-full py-4 text-lg font-bold rounded-xl flex items-center justify-center gap-2 transition duration-200 ${
            isClockedIn 
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20 shadow-lg' 
              : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20 shadow-lg'
          }`}
        >
          {isClockedIn ? <Square size={20} /> : <Play size={20} />}
          <span>{detecting ? 'Detecting Location...' : isClockedIn ? 'Clock Out' : 'Clock In'}</span>
        </button>
      </div>
    </div>
  );
}
```

### 2.4 Navigation Shell Layout: `src/layouts/MainLayout.jsx`
Main layout wrapper using Tailwind CSS, replacing the desktop/mobile nav builder functions in [buildNavigation](file:///c:/Users/chagantipati%20sanjay/Time_sheets/app.js#L293-L350):

```jsx
import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Clock, Users, LayoutDashboard, LogOut } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

export default function MainLayout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen bg-bgPrimary text-white flex flex-col font-sans">
      {/* Header Bar */}
      <header className="sticky top-0 z-50 bg-bgSecondary/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
              <Clock size={22} className="animate-pulse text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Vergil<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Tempo</span>
            </span>
          </div>

          {/* Desktop Navigation Link Menu */}
          <nav className="hidden md:flex items-center gap-2">
            {user.role === 'admin' ? (
              <NavLink 
                to="/admin" 
                className={({ isActive }) => 
                  `px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition ${
                    isActive ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <LayoutDashboard size={18} />
                <span>Overview</span>
              </NavLink>
            ) : (
              <NavLink 
                to="/employee" 
                className={({ isActive }) => 
                  `px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition ${
                    isActive ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Clock size={18} />
                <span>Clock Portal</span>
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold">{user.name}</div>
              <div className="text-xs text-indigo-400 font-bold uppercase tracking-wider">{user.role}</div>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 border border-white/10 hover:border-gray-500 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition text-gray-300 hover:text-white hover:bg-white/5"
            >
              <LogOut size={14} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-8 pb-24 md:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bgSecondary/90 backdrop-blur-lg border-t border-white/5 py-2 px-6 flex items-center justify-around z-50">
        {user.role === 'admin' ? (
          <>
            <NavLink to="/admin" className="flex flex-col items-center text-xs text-gray-400 font-medium">
              <LayoutDashboard size={20} />
              <span className="mt-1">Overview</span>
            </NavLink>
            <button onClick={() => navigate('/admin?action=create')} className="flex flex-col items-center text-xs text-gray-400 font-medium">
              <Users size={20} />
              <span className="mt-1">Create</span>
            </button>
          </>
        ) : (
          <NavLink to="/employee" className="flex flex-col items-center text-xs text-gray-400 font-medium">
            <Clock size={20} />
            <span className="mt-1">Clock</span>
          </NavLink>
        )}
        <button onClick={handleLogout} className="flex flex-col items-center text-xs text-gray-400 font-medium">
          <LogOut size={20} />
          <span className="mt-1">Logout</span>
        </button>
      </nav>
    </div>
  );
}
```

/* ==========================================================================
   CHRONOFLOW CLIENT-SIDE APPLICATION ENGINE
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- APP STATE ---
    let state = {
        users: [],
        timesheets: [],
        currentUser: null,
        activeClockId: null,
        tickerInterval: null,
        chartInstance: null
    };

    // --- DOM ELEMENT REFERENCES ---
    const elements = {
        appHeader: document.getElementById('app-header'),
        userDisplayName: document.getElementById('user-display-name'),
        userDisplayRole: document.getElementById('user-display-role'),
        logoutBtn: document.getElementById('logout-btn'),
        desktopNav: document.getElementById('desktop-nav'),
        mobileBottomNav: document.getElementById('mobile-bottom-nav'),
        viewLoader: document.getElementById('view-loader'),
        viewLogin: document.getElementById('view-login'),
        viewEmployee: document.getElementById('view-employee'),
        viewAdmin: document.getElementById('view-admin'),
        
        // Login Page
        loginForm: document.getElementById('login-form'),
        loginUsername: document.getElementById('login-username'),
        loginSubmitBtn: document.getElementById('login-submit-btn'),
        
        // Employee Page
        liveTime: document.getElementById('live-time'),
        liveDate: document.getElementById('live-date'),
        statusDot: document.getElementById('status-dot'),
        clockStatusText: document.getElementById('clock-status-text'),
        clockNotes: document.getElementById('clock-notes'),
        clockActionBtn: document.getElementById('clock-action-btn'),
        notesContainer: document.getElementById('notes-container'),
        locationBadge: document.getElementById('location-badge'),
        locationText: document.getElementById('location-text'),
        empStatToday: document.getElementById('emp-stat-today'),
        empStatWeek: document.getElementById('emp-stat-week'),
        empStatApproved: document.getElementById('emp-stat-approved'),
        empLogsBody: document.getElementById('emp-logs-body'),
        empLogsEmpty: document.getElementById('emp-logs-empty'),
        empRefreshBtn: document.getElementById('emp-refresh-btn'),
        
        // Admin Page
        adminStatActive: document.getElementById('admin-stat-active'),
        adminStatEmployees: document.getElementById('admin-stat-employees'),
        adminStatClients: document.getElementById('admin-stat-clients'),
        adminCreateEmpBtn: document.getElementById('admin-create-emp-btn'),
        adminAddLogBtn: document.getElementById('admin-add-log-btn'),
        adminExportBtn: document.getElementById('admin-export-btn'),
        adminMonthlyDownloadBtn: document.getElementById('admin-monthly-download-btn'),
        filterEmployee: document.getElementById('filter-employee'),
        filterClient: document.getElementById('filter-client'),
        filterStartDate: document.getElementById('filter-start-date'),
        filterEndDate: document.getElementById('filter-end-date'),
        adminClearFilters: document.getElementById('admin-clear-filters'),
        adminTimesheetsTable: document.getElementById('admin-timesheets-table'),
        adminTimesheetsBody: document.getElementById('admin-timesheets-body'),
        adminTimesheetsEmpty: document.getElementById('admin-timesheets-empty'),
        timesheetCountBadge: document.getElementById('timesheet-count-badge'),
        statActiveNow: document.getElementById('stat-active-now'),
        
        // Modals
        modalCreateEmployee: document.getElementById('modal-create-employee'),
        createEmployeeForm: document.getElementById('create-employee-form'),
        modalEditLog: document.getElementById('modal-edit-log'),
        editLogForm: document.getElementById('edit-log-form'),
        modalMonthlyDownload: document.getElementById('modal-monthly-download'),
        monthlyDownloadForm: document.getElementById('monthly-download-form'),
        monthlyDownloadEmployee: document.getElementById('monthly-download-employee'),
        monthlyDownloadDate: document.getElementById('monthly-download-date'),
        toastContainer: document.getElementById('toast-container')
    };

    // ==========================================================================
    // 1. DATABASE LAYER (localStorage + Seeding)
    // ==========================================================================

    const SEED_USERS = [
        { id: 'u-admin', name: 'Staffing Manager', username: 'admin', password: 'admin123', role: 'admin', clientCompany: 'Operations', rate: 50 },
        { id: 'u-emp1', name: 'John Doe', username: 'employee1', password: 'emp123', role: 'employee', clientCompany: 'Microsoft', rate: 35 },
        { id: 'u-emp2', name: 'Jane Smith', username: 'employee2', password: 'emp123', role: 'employee', clientCompany: 'Google', rate: 30 },
        { id: 'u-emp3', name: 'David Lee', username: 'dlee', password: 'emp123', role: 'employee', clientCompany: 'Microsoft', rate: 40 },
        { id: 'u-emp4', name: 'Sarah Connor', username: 'sconnor', password: 'emp123', role: 'employee', clientCompany: 'Meta', rate: 28 },
        { id: 'u-emp5', name: 'Alex Rivera', username: 'arivera', password: 'emp123', role: 'employee', clientCompany: 'Amazon', rate: 25 }
    ];

    // Seed Timesheets over the last week
    function generateSeedTimesheets() {
        const logs = [];
        const users = SEED_USERS.filter(u => u.role === 'employee');
        const now = new Date();
        
        // Generate records for the last 6 days
        for (let i = 6; i >= 1; i--) {
            const date = new Date();
            date.setDate(now.getDate() - i);
            const dateString = date.toISOString().split('T')[0];

            users.forEach((emp, index) => {
                // Randomly skip some days to make logs look natural
                if ((index + i) % 5 === 0) return;

                // Typical clock-in times (around 8am - 9am)
                const checkInHour = 8 + (index % 2); 
                const checkInMinute = 15 * (index % 4);
                
                // Typical clock-out times (after 8-9 hours)
                const workedHours = 8 + (index % 2) * 0.5 + (i % 2) * 0.25; 
                const checkOutHour = checkInHour + Math.floor(workedHours);
                const checkOutMinute = checkInMinute + Math.round((workedHours % 1) * 60);

                const inTime = `${String(checkInHour).padStart(2, '0')}:${String(checkInMinute).padStart(2, '0')}:00`;
                const outTime = `${String(checkOutHour).padStart(2, '0')}:${String(checkOutMinute).padStart(2, '0')}:00`;

                // Notes sample
                const noteSamples = [
                    'Working on project codebase optimization.',
                    'Wireframes design and review feedback integration.',
                    'Engineering standup and server setup.',
                    'Client presentation planning & deck revision.',
                    'Resolving layout issues on checkout flows.'
                ];
                const note = noteSamples[(index + i) % noteSamples.length];
                const locations = ['Remote (Boston Office)', 'Remote (Home Office)', 'HQ - Conference Room B', 'Co-working Space'];
                const location = locations[(index + i) % locations.length];

                logs.push({
                    id: `log-${Date.now()}-${index}-${i}`,
                    userId: emp.id,
                    date: dateString,
                    clockIn: inTime,
                    clockOut: outTime,
                    hours: workedHours,
                    notes: note,
                    location: location,
                    clientCompany: emp.clientCompany
                });
            });
        }
        
        // Add one active clock-in for John Doe today (for demo purposes)
        const todayStr = now.toISOString().split('T')[0];
        logs.push({
            id: 'log-active-demo',
            userId: 'u-emp1',
            date: todayStr,
            clockIn: '09:00:00',
            clockOut: null,
            hours: null,
            notes: '',
            location: 'HQ - Main Office',
            clientCompany: 'Microsoft'
        });

        return logs;
    }

    function initDatabase(forceReset = false) {
        if (forceReset || !localStorage.getItem('cf_users')) {
            localStorage.setItem('cf_users', JSON.stringify(SEED_USERS));
            localStorage.setItem('cf_timesheets', JSON.stringify(generateSeedTimesheets()));
            showToast('Database initialized with sample records', 'info');
        }
        state.users = JSON.parse(localStorage.getItem('cf_users'));
        state.timesheets = JSON.parse(localStorage.getItem('cf_timesheets'));
    }

    function saveUsers() {
        localStorage.setItem('cf_users', JSON.stringify(state.users));
    }

    function saveTimesheets() {
        localStorage.setItem('cf_timesheets', JSON.stringify(state.timesheets));
    }

    // ==========================================================================
    // 2. TOAST SYSTEM
    // ==========================================================================
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let iconName = 'info';
        if (type === 'success') iconName = 'check-circle';
        if (type === 'error') iconName = 'alert-triangle';
        if (type === 'warning') iconName = 'alert-circle';
        
        toast.innerHTML = `
            <i data-lucide="${iconName}" class="toast-icon"></i>
            <div class="toast-content">
                <p class="toast-message">${message}</p>
            </div>
        `;
        
        elements.toastContainer.appendChild(toast);
        lucide.createIcons();
        
        // Micro-timeout to trigger slide-in transition
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Remove toast after 3.5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3500);
    }

    // ==========================================================================
    // 3. AUTHENTICATION & ROUTER
    // ==========================================================================

    function checkSession() {
        const savedSession = localStorage.getItem('cf_current_session');
        if (savedSession) {
            state.currentUser = JSON.parse(savedSession);
            // Verify user still exists in database
            const userExists = state.users.find(u => u.id === state.currentUser.id);
            if (!userExists) {
                logout();
                return;
            }
            // Update displayName & header
            elements.userDisplayName.textContent = state.currentUser.name;
            elements.userDisplayRole.textContent = state.currentUser.role;
            elements.appHeader.classList.remove('hidden');
            
            // Build header nav & bottom nav
            buildNavigation();
            
            // Check active clock-in
            checkActiveClockIn();

            // Redirect based on role
            if (state.currentUser.role === 'admin') {
                navigateTo('admin');
            } else {
                navigateTo('employee');
            }
        } else {
            navigateTo('login');
        }
    }

    function login(username, password) {
        const user = state.users.find(u => u.username.toLowerCase() === username.toLowerCase().trim() && u.password === password);
        
        if (user) {
            state.currentUser = user;
            localStorage.setItem('cf_current_session', JSON.stringify(user));
            
            elements.userDisplayName.textContent = user.name;
            elements.userDisplayRole.textContent = user.role;
            elements.appHeader.classList.remove('hidden');
            
            buildNavigation();
            checkActiveClockIn();
            
            showToast(`Welcome back, ${user.name}!`, 'success');
            
            if (user.role === 'admin') {
                navigateTo('admin');
            } else {
                navigateTo('employee');
            }
        } else {
            showToast('Invalid username or password', 'error');
            elements.loginSubmitBtn.disabled = false;
        }
    }

    function logout() {
        // Stop ticker if active
        if (state.tickerInterval) clearInterval(state.tickerInterval);
        
        state.currentUser = null;
        state.activeClockId = null;
        localStorage.removeItem('cf_current_session');
        
        elements.appHeader.classList.add('hidden');
        elements.mobileBottomNav.classList.add('hidden');
        navigateTo('login');
        showToast('Logged out successfully', 'info');
    }

    function buildNavigation() {
        if (!state.currentUser) return;
        
        let deskNavHtml = '';
        let mobNavHtml = '';
        
        if (state.currentUser.role === 'admin') {
            deskNavHtml = `
                <a href="#admin" class="nav-link active" id="nav-admin-dashboard"><i data-lucide="layout-dashboard"></i> Overview</a>
            `;
            mobNavHtml = `
                <a href="#admin" class="mobile-nav-item active" id="mob-admin-dashboard"><i data-lucide="layout-dashboard"></i>Overview</a>
                <a href="#" class="mobile-nav-item" id="mob-admin-create-emp"><i data-lucide="user-plus"></i>Create</a>
                <a href="#" class="mobile-nav-item" id="mob-admin-export"><i data-lucide="download"></i>Export</a>
                <a href="#" class="mobile-nav-item" id="mob-logout"><i data-lucide="log-out"></i>Logout</a>
            `;
        } else {
            deskNavHtml = `
                <a href="#employee" class="nav-link active" id="nav-employee-dashboard"><i data-lucide="clock"></i> Clock Portal</a>
            `;
            mobNavHtml = `
                <a href="#employee" class="mobile-nav-item active" id="mob-employee-dashboard"><i data-lucide="clock"></i>Clock</a>
                <a href="#" class="mobile-nav-item" id="mob-employee-refresh"><i data-lucide="rotate-cw"></i>Refresh</a>
                <a href="#" class="mobile-nav-item" id="mob-logout-emp"><i data-lucide="log-out"></i>Logout</a>
            `;
        }
        
        elements.desktopNav.innerHTML = deskNavHtml;
        elements.mobileBottomNav.innerHTML = mobNavHtml;
        elements.mobileBottomNav.classList.remove('hidden');
        lucide.createIcons();
        
        // Hook mobile special triggers
        if (state.currentUser.role === 'admin') {
            document.getElementById('mob-admin-create-emp').addEventListener('click', (e) => {
                e.preventDefault();
                openModal(elements.modalCreateEmployee);
            });
            document.getElementById('mob-admin-export').addEventListener('click', (e) => {
                e.preventDefault();
                exportFilteredTimesheets();
            });
            document.getElementById('mob-logout').addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        } else {
            document.getElementById('mob-employee-refresh').addEventListener('click', (e) => {
                e.preventDefault();
                renderEmployeeLogs();
                showToast('Work logs refreshed', 'success');
            });
            document.getElementById('mob-logout-emp').addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }
    }

    function navigateTo(viewName) {
        // Hide all panels
        elements.viewLoader.classList.add('hidden');
        elements.viewLogin.classList.add('hidden');
        elements.viewEmployee.classList.add('hidden');
        elements.viewAdmin.classList.add('hidden');
        
        // Deactivate all nav items
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.mobile-nav-item').forEach(l => l.classList.remove('active'));
        
        if (viewName === 'login') {
            elements.viewLogin.classList.remove('hidden');
            elements.mobileBottomNav.classList.add('hidden');
            window.location.hash = '#login';
        } else if (viewName === 'employee') {
            elements.viewEmployee.classList.remove('hidden');
            const navLink = document.getElementById('nav-employee-dashboard');
            const mobLink = document.getElementById('mob-employee-dashboard');
            if (navLink) navLink.classList.add('active');
            if (mobLink) mobLink.classList.add('active');
            window.location.hash = '#employee';
            
            renderEmployeeDashboard();
        } else if (viewName === 'admin') {
            elements.viewAdmin.classList.remove('hidden');
            const navLink = document.getElementById('nav-admin-dashboard');
            const mobLink = document.getElementById('mob-admin-dashboard');
            if (navLink) navLink.classList.add('active');
            if (mobLink) mobLink.classList.add('active');
            window.location.hash = '#admin';
            
            renderAdminDashboard();
        }
        lucide.createIcons();
    }

    // Hash change listener for back button support
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash;
        if (!state.currentUser) {
            navigateTo('login');
            return;
        }
        if (hash === '#employee' && state.currentUser.role === 'employee') {
            navigateTo('employee');
        } else if (hash === '#admin' && state.currentUser.role === 'admin') {
            navigateTo('admin');
        }
    });

    // ==========================================================================
    // 4. CLOCK MODULE (Employee Views & Actions)
    // ==========================================================================

    function checkActiveClockIn() {
        if (!state.currentUser) return;
        
        // Find if this employee has an entry with no clockOut
        const activeEntry = state.timesheets.find(t => t.userId === state.currentUser.id && t.clockOut === null);
        if (activeEntry) {
            state.activeClockId = activeEntry.id;
            startClockTicker(activeEntry.date, activeEntry.clockIn);
            setClockUI(true);
        } else {
            state.activeClockId = null;
            stopClockTicker();
            setClockUI(false);
        }
    }

    function setClockUI(isClockedIn) {
        if (isClockedIn) {
            elements.clockStatusText.textContent = 'Clocked In';
            elements.statusDot.className = 'status-indicator-dot active';
            elements.clockActionBtn.className = 'btn clock-btn btn-danger';
            elements.clockActionBtn.innerHTML = '<i data-lucide="square" class="btn-icon"></i> <span>Clock Out</span>';
            elements.notesContainer.classList.remove('hidden');
            elements.locationBadge.classList.remove('hidden');
        } else {
            elements.clockStatusText.textContent = 'Clocked Out';
            elements.statusDot.className = 'status-indicator-dot';
            elements.clockActionBtn.className = 'btn clock-btn btn-success';
            elements.clockActionBtn.innerHTML = '<i data-lucide="play" class="btn-icon"></i> <span>Clock In</span>';
            elements.notesContainer.classList.add('hidden');
            elements.locationBadge.classList.add('hidden');
            elements.clockNotes.value = '';
        }
        lucide.createIcons();
    }

    function startClockTicker(startDateStr, startTimeStr) {
        if (state.tickerInterval) clearInterval(state.tickerInterval);
        
        // Combine startDate and startTime to compute elapsed
        const startDateTime = new Date(`${startDateStr}T${startTimeStr}`);
        
        function updateTicker() {
            const now = new Date();
            const elapsedMs = now - startDateTime;
            
            if (elapsedMs < 0) {
                elements.liveTime.textContent = '00:00:00';
                return;
            }
            
            const hours = Math.floor(elapsedMs / 3600000);
            const minutes = Math.floor((elapsedMs % 3600000) / 60000);
            const seconds = Math.floor((elapsedMs % 60000) / 1000);
            
            elements.liveTime.textContent = 
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
        
        updateTicker();
        state.tickerInterval = setInterval(updateTicker, 1000);
    }

    function stopClockTicker() {
        if (state.tickerInterval) {
            clearInterval(state.tickerInterval);
            state.tickerInterval = null;
        }
        
        // Default display shows actual live time
        function updateLiveClock() {
            if (state.tickerInterval) return; // Guard
            const now = new Date();
            elements.liveTime.textContent = now.toTimeString().split(' ')[0];
            
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            elements.liveDate.textContent = now.toLocaleDateString('en-US', options);
        }
        
        updateLiveClock();
        // Set an interval that updates clock display every second if not tracking active clock-in
        state.tickerInterval = setInterval(updateLiveClock, 1000);
    }

    function captureLocation(callback) {
        elements.locationText.textContent = 'Detecting Location...';
        elements.locationBadge.classList.remove('hidden');
        
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude.toFixed(4);
                    const lng = position.coords.longitude.toFixed(4);
                    const mockAddress = getRandomMockAddress();
                    const locStr = `Lat: ${lat}, Lng: ${lng} (${mockAddress})`;
                    elements.locationText.textContent = locStr;
                    callback(locStr);
                },
                (error) => {
                    // Fallback to purely simulated location on permission block
                    const mockAddress = getRandomMockAddress();
                    const lat = (42.3601 + (Math.random() - 0.5) * 0.05).toFixed(4);
                    const lng = (-71.0589 + (Math.random() - 0.5) * 0.05).toFixed(4);
                    const locStr = `Lat: ${lat}, Lng: ${lng} (${mockAddress} - Simulated)`;
                    elements.locationText.textContent = locStr;
                    callback(locStr);
                },
                { timeout: 5000 }
            );
        } else {
            const mockAddress = getRandomMockAddress();
            const locStr = `Simulated: ${mockAddress}`;
            elements.locationText.textContent = locStr;
            callback(locStr);
        }
    }

    function getRandomMockAddress() {
        const offices = [
            'HQ Boston, MA',
            'NYC Branch Office',
            'Remote - Co-working Space',
            'Home Office (Virtual VPN)',
            'Seattle Engineering Hub',
            'London Operations Branch'
        ];
        return offices[Math.floor(Math.random() * offices.length)];
    }

    function handleClockAction() {
        if (!state.currentUser) return;
        
        if (state.activeClockId === null) {
            // Clock IN Flow
            captureLocation((locationString) => {
                const now = new Date();
                const todayStr = now.toISOString().split('T')[0];
                const timeStr = now.toTimeString().split(' ')[0]; // HH:MM:SS
                
                const newLog = {
                    id: `log-${Date.now()}`,
                    userId: state.currentUser.id,
                    date: todayStr,
                    clockIn: timeStr,
                    clockOut: null,
                    hours: null,
                    notes: '',
                    location: locationString,
                    clientCompany: state.currentUser.clientCompany || 'Microsoft'
                };
                
                state.timesheets.push(newLog);
                saveTimesheets();
                
                state.activeClockId = newLog.id;
                setClockUI(true);
                startClockTicker(todayStr, timeStr);
                
                showToast('Successfully Clocked In!', 'success');
                renderEmployeeDashboard();
            });
        } else {
            // Clock OUT Flow
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];
            const timeStr = now.toTimeString().split(' ')[0]; // HH:MM:SS
            
            const logIndex = state.timesheets.findIndex(t => t.id === state.activeClockId);
            
            if (logIndex !== -1) {
                const log = state.timesheets[logIndex];
                log.clockOut = timeStr;
                
                // Calculate hours
                const inTime = new Date(`${log.date}T${log.clockIn}`);
                const outTime = new Date(`${todayStr}T${timeStr}`);
                
                let diffHours = (outTime - inTime) / 3600000;
                if (diffHours < 0) diffHours = 0; // Guard against negative
                log.hours = parseFloat(diffHours.toFixed(2));
                
                log.notes = elements.clockNotes.value.trim();
                
                state.timesheets[logIndex] = log;
                saveTimesheets();
                
                state.activeClockId = null;
                setClockUI(false);
                stopClockTicker();
                
                showToast(`Clocked Out. Hours Logged: ${log.hours}h`, 'success');
                renderEmployeeDashboard();
            }
        }
    }

    function renderEmployeeDashboard() {
        // Calculate personal metrics
        const myLogs = state.timesheets.filter(t => t.userId === state.currentUser.id);
        const todayStr = new Date().toISOString().split('T')[0];
        
        // 1. Today Hours
        const todayHours = myLogs
            .filter(t => t.date === todayStr && t.clockOut !== null)
            .reduce((sum, current) => sum + current.hours, 0);
            
        // Calculate current active running hours if clocked in
        let runningTodayVal = todayHours;
        if (state.activeClockId) {
            const activeLog = state.timesheets.find(t => t.id === state.activeClockId);
            if (activeLog && activeLog.date === todayStr) {
                const inTime = new Date(`${activeLog.date}T${activeLog.clockIn}`);
                const runDiff = (new Date() - inTime) / 3600000;
                if (runDiff > 0) runningTodayVal += runDiff;
            }
        }
        elements.empStatToday.textContent = `${runningTodayVal.toFixed(1)}h`;
        
        // 2. Week Hours
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
        startOfWeek.setHours(0,0,0,0);
        
        const weekHours = myLogs
            .filter(t => {
                const logDate = new Date(t.date);
                return logDate >= startOfWeek && t.clockOut !== null;
            })
            .reduce((sum, current) => sum + current.hours, 0);
            
        let runningWeekVal = weekHours;
        if (state.activeClockId) {
            const activeLog = state.timesheets.find(t => t.id === state.activeClockId);
            if (activeLog) {
                const logDate = new Date(activeLog.date);
                if (logDate >= startOfWeek) {
                    const inTime = new Date(`${activeLog.date}T${activeLog.clockIn}`);
                    const runDiff = (new Date() - inTime) / 3600000;
                    if (runDiff > 0) runningWeekVal += runDiff;
                }
            }
        }
        elements.empStatWeek.textContent = `${runningWeekVal.toFixed(1)}h`;
        
        // 3. Shifts logged
        elements.empStatApproved.textContent = myLogs.length;
        
        renderEmployeeLogs();
    }

    function renderEmployeeLogs() {
        const myLogs = state.timesheets
            .filter(t => t.userId === state.currentUser.id)
            .sort((a,b) => new Date(b.date + 'T' + b.clockIn) - new Date(a.date + 'T' + a.clockIn)); // Sort newest first
            
        elements.empLogsBody.innerHTML = '';
        
        if (myLogs.length === 0) {
            elements.empLogsEmpty.classList.remove('hidden');
            elements.empLogsBody.closest('.table-responsive').classList.add('hidden');
            return;
        }
        
        elements.empLogsEmpty.classList.add('hidden');
        elements.empLogsBody.closest('.table-responsive').classList.remove('hidden');
        
        myLogs.forEach(log => {
            const row = document.createElement('tr');
            const formattedDate = formatDateFriendly(log.date);
            const totalHoursStr = log.clockOut ? `${log.hours.toFixed(2)} hrs` : 'Active...';
            
            row.innerHTML = `
                <td data-label="Date" class="font-semibold">${formattedDate}</td>
                <td data-label="Clock In"><i data-lucide="play-circle" class="table-icon-emerald"></i> ${formatTime12h(log.clockIn)}</td>
                <td data-label="Clock Out"><i data-lucide="stop-circle" class="table-icon-rose"></i> ${log.clockOut ? formatTime12h(log.clockOut) : '<span class="text-accent animate-pulse font-semibold">Active Now</span>'}</td>
                <td data-label="Total Hours" class="font-bold">${totalHoursStr}</td>
                <td data-label="Location" class="text-sm text-muted-cell"><i data-lucide="map-pin" class="table-icon-sky"></i> ${log.location || 'Not Captured'}</td>
                <td data-label="Work Notes" class="text-sm log-note-cell" title="${log.notes || ''}">${log.notes || '<span class="text-muted italic">No notes</span>'}</td>
                <td data-label="Client" class="font-semibold text-accent">${log.clientCompany || 'N/A'}</td>
            `;
            elements.empLogsBody.appendChild(row);
        });
        
        lucide.createIcons();
    }

    // ==========================================================================
    // 5. ADMIN MODULE
    // ==========================================================================

    function renderAdminDashboard() {
        // Calculate and display top admin stats
        const activeClockins = state.timesheets.filter(t => t.clockOut === null).length;
        elements.adminStatActive.textContent = activeClockins;
        
        // Total employees (placed candidates)
        const empCount = state.users.filter(u => u.role === 'employee').length;
        elements.adminStatEmployees.textContent = empCount;
        
        // Active clients count
        const uniqueClients = [...new Set(state.users.filter(u => u.role === 'employee').map(u => u.clientCompany))];
        elements.adminStatClients.textContent = uniqueClients.length;

        // Populate Candidate Filters
        populateEmployeeFilters();

        // Render Timesheets Table
        renderAdminTimesheets();

        // Initialize Chart
        renderDepartmentChart();
    }

    function populateEmployeeFilters() {
        const employeeList = state.users.filter(u => u.role === 'employee');
        
        // Store current value to avoid reset
        const currentSelectedFilter = elements.filterEmployee.value;
        const currentClientFilter = elements.filterClient.value;
        
        // 1. Populate Candidate Filters
        let html = '<option value="all">All Candidates</option>';
        employeeList.forEach(emp => {
            html += `<option value="${emp.id}">${emp.name} (Placed: ${emp.clientCompany || 'N/A'})</option>`;
        });
        elements.filterEmployee.innerHTML = html;
        elements.filterEmployee.value = currentSelectedFilter || 'all';

        // Populate monthly downloader candidate list
        const dlSelect = document.getElementById('monthly-download-employee');
        dlSelect.innerHTML = employeeList.map(emp => `<option value="${emp.id}">${emp.name}</option>`).join('');

        // 2. Populate Client Company Filters
        const uniqueClients = [...new Set(employeeList.map(u => u.clientCompany))].filter(Boolean);
        let clientHtml = '<option value="all">All Client MNCs</option>';
        uniqueClients.forEach(client => {
            clientHtml += `<option value="${client}">${client}</option>`;
        });
        elements.filterClient.innerHTML = clientHtml;
        elements.filterClient.value = currentClientFilter || 'all';

        // Also populate candidate selector inside Edit/Add Log modal
        const modalSelect = document.getElementById('edit-log-employee');
        let modalHtml = '';
        employeeList.forEach(emp => {
            modalHtml += `<option value="${emp.id}">${emp.name}</option>`;
        });
        modalSelect.innerHTML = modalHtml;
    }

    function renderAdminTimesheets() {
        const empFilter = elements.filterEmployee.value;
        const clientFilter = elements.filterClient.value;
        const startFilter = elements.filterStartDate.value;
        const endFilter = elements.filterEndDate.value;
        
        let filtered = [...state.timesheets];
        
        // Apply filters
        if (empFilter !== 'all') {
            filtered = filtered.filter(t => t.userId === empFilter);
        }
        
        if (clientFilter !== 'all') {
            filtered = filtered.filter(t => t.clientCompany === clientFilter);
        }
        
        if (startFilter) {
            filtered = filtered.filter(t => t.date >= startFilter);
        }
        
        if (endFilter) {
            filtered = filtered.filter(t => t.date <= endFilter);
        }
        
        // Sort newest first
        filtered.sort((a,b) => new Date(b.date + 'T' + b.clockIn) - new Date(a.date + 'T' + a.clockIn));
        
        // Set badge count
        elements.timesheetCountBadge.textContent = `${filtered.length} entries`;
        elements.adminTimesheetsBody.innerHTML = '';
        
        if (filtered.length === 0) {
            elements.adminTimesheetsEmpty.classList.remove('hidden');
            elements.adminTimesheetsTable.classList.add('hidden');
            return;
        }
        
        elements.adminTimesheetsEmpty.classList.add('hidden');
        elements.adminTimesheetsTable.classList.remove('hidden');
        
        filtered.forEach(log => {
            const employeeObj = state.users.find(u => u.id === log.userId) || { name: 'Unknown Candidate', clientCompany: 'N/A' };
            const row = document.createElement('tr');
            
            const formattedDate = formatDateFriendly(log.date);
            const totalHoursStr = log.clockOut ? `${log.hours.toFixed(2)} hrs` : '<span class="text-accent animate-pulse font-semibold">Active Clock</span>';
            
            row.innerHTML = `
                <td data-label="Candidate" class="emp-cell">
                    <span class="emp-cell-name font-bold">${employeeObj.name}</span>
                    <span class="emp-cell-dept text-xs opacity-70">Client: ${log.clientCompany || 'N/A'}</span>
                </td>
                <td data-label="Date">${formattedDate}</td>
                <td data-label="Clock In">${formatTime12h(log.clockIn)}</td>
                <td data-label="Clock Out">${log.clockOut ? formatTime12h(log.clockOut) : '<span class="text-accent italic font-semibold">In Progress</span>'}</td>
                <td data-label="Total Hours" class="font-bold">${totalHoursStr}</td>
                <td data-label="Notes" class="text-sm max-w-xs truncate" title="${log.notes || ''}">${log.notes || '<span class="text-muted italic">none</span>'}</td>
                <td data-label="Location" class="text-sm truncate" title="${log.location || ''}"><i data-lucide="map-pin" class="table-icon-sky"></i> ${log.location ? log.location.split(' (')[0] : 'N/A'}</td>
                <td data-label="Client" class="font-semibold text-accent">${log.clientCompany || 'N/A'}</td>
                <td class="actions-cell">
                    <button class="btn btn-sm btn-outline btn-edit-log" data-id="${log.id}" title="Edit Log" aria-label="Edit">
                        <i data-lucide="edit-3"></i>
                    </button>
                    <button class="btn btn-sm btn-outline btn-danger btn-delete-log" data-id="${log.id}" title="Delete Log" aria-label="Delete">
                        <i data-lucide="trash-2"></i>
                    </button>
                </td>
            `;
            elements.adminTimesheetsBody.appendChild(row);
        });
        
        lucide.createIcons();
        attachAdminTableEvents();
    }

    function attachAdminTableEvents() {
        // Edit Log Modal trigger
        document.querySelectorAll('.btn-edit-log').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const logId = e.currentTarget.getAttribute('data-id');
                openEditLogModal(logId);
            });
        });

        // Delete Log trigger
        document.querySelectorAll('.btn-delete-log').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const logId = e.currentTarget.getAttribute('data-id');
                if (confirm('Are you sure you want to permanently delete this timesheet entry?')) {
                    deleteLog(logId);
                }
            });
        });
    }

    function deleteLog(logId) {
        state.timesheets = state.timesheets.filter(t => t.id !== logId);
        saveTimesheets();
        showToast('Timesheet record deleted', 'success');
        renderAdminDashboard();
    }

    // --- CHART IMPLEMENTATION (Chart.js) ---
    function renderDepartmentChart() {
        if (elements.deptHoursChart === null) return;
        
        const ctx = document.getElementById('deptHoursChart').getContext('2d');
        
        // Calculate total hours by client company this week
        const clientHoursMap = {};
        const clients = ['Microsoft', 'Google', 'Meta', 'Amazon', 'Netflix'];
        clients.forEach(c => clientHoursMap[c] = 0);

        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0,0,0,0);
        
        state.timesheets.forEach(log => {
            if (log.clockOut !== null && new Date(log.date) >= startOfWeek) {
                const client = log.clientCompany || 'Microsoft';
                clientHoursMap[client] = (clientHoursMap[client] || 0) + log.hours;
            }
        });
        
        const labels = Object.keys(clientHoursMap);
        const data = Object.values(clientHoursMap);

        if (state.chartInstance) {
            state.chartInstance.destroy();
        }
        
        state.chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Hours Billed (This Week)',
                    data: data,
                    backgroundColor: [
                        'rgba(99, 102, 241, 0.75)',  // Indigo
                        'rgba(16, 185, 129, 0.75)',  // Emerald
                        'rgba(139, 92, 246, 0.75)',  // Purple
                        'rgba(245, 158, 11, 0.75)',  // Amber
                        'rgba(14, 165, 233, 0.75)'   // Sky
                    ],
                    borderColor: [
                        '#6366f1',
                        '#10b981',
                        '#8b5cf6',
                        '#f59e0b',
                        '#0ea5e9'
                    ],
                    borderWidth: 1.5,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        padding: 12,
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        borderColor: 'rgba(255,255,255,0.08)',
                        borderWidth: 1,
                        titleFont: { family: 'Outfit', size: 14, weight: 'bold' },
                        bodyFont: { family: 'Outfit', size: 13 },
                        callbacks: {
                            label: function(context) {
                                return ` ${context.parsed.y.toFixed(2)} hours billed`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: '#9ca3af',
                            font: { family: 'Outfit', size: 11 }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#9ca3af',
                            font: { family: 'Outfit', size: 12, weight: 'bold' }
                        }
                    }
                }
            }
        });
    }

    // ==========================================================================
    // 6. CSV EXPORT & REPORTING
    // ==========================================================================

    function exportFilteredTimesheets() {
        const empFilter = elements.filterEmployee.value;
        const clientFilter = elements.filterClient.value;
        const startFilter = elements.filterStartDate.value;
        const endFilter = elements.filterEndDate.value;
        
        let filtered = [...state.timesheets];
        
        // Apply current UI filters
        if (empFilter !== 'all') {
            filtered = filtered.filter(t => t.userId === empFilter);
        }
        if (clientFilter !== 'all') {
            filtered = filtered.filter(t => t.clientCompany === clientFilter);
        }
        if (startFilter) {
            filtered = filtered.filter(t => t.date >= startFilter);
        }
        if (endFilter) {
            filtered = filtered.filter(t => t.date <= endFilter);
        }
        
        if (filtered.length === 0) {
            showToast('No records available for export based on active filters.', 'warning');
            return;
        }

        // Generate CSV content
        let csvContent = 'Candidate Name,Client Company,Hourly Rate ($),Date,Clock In,Clock Out,Total Hours,Location Captured,Work Notes\n';
        
        filtered.forEach(log => {
            const user = state.users.find(u => u.id === log.userId) || { name: 'Unknown', clientCompany: 'N/A', rate: 0 };
            
            // Clean notes of any quotes/commas that would break CSV format
            const cleanNotes = log.notes ? `"${log.notes.replace(/"/g, '""')}"` : '""';
            const cleanLocation = log.location ? `"${log.location.replace(/"/g, '""')}"` : '""';
            
            const hoursStr = log.clockOut ? log.hours : 'Active Clock';
            const clockOutTime = log.clockOut || 'N/A';
            
            csvContent += `"${user.name}","${log.clientCompany || 'N/A'}",${user.rate},"${log.date}","${log.clockIn}","${clockOutTime}",${hoursStr},${cleanLocation},${cleanNotes}\n`;
        });
        
        // Trigger file download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        const timestamp = new Date().toISOString().slice(0, 10);
        link.setAttribute('href', url);
        link.setAttribute('download', `ChronoFlow_Timesheets_${timestamp}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('Timesheets exported successfully!', 'success');
    }

    // --- INDIVIDUAL MONTHLY DOWNLOADER ---
    function exportCandidateMonthlyCSV(userId, yearMonth) {
        const candidate = state.users.find(u => u.id === userId);
        if (!candidate) return;

        // Filter logs for this candidate & month
        const monthlyLogs = state.timesheets
            .filter(t => t.userId === userId && t.date.startsWith(yearMonth) && t.clockOut !== null)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (monthlyLogs.length === 0) {
            showToast(`No logged hours found for ${candidate.name} in ${formatMonthYearLabel(yearMonth)}`, 'warning');
            return;
        }

        // Calculate Totals
        const totalHours = monthlyLogs.reduce((sum, log) => sum + log.hours, 0);
        const totalBillable = totalHours * (candidate.rate || 0);

        // Format dates nicely
        const monthLabel = formatMonthYearLabel(yearMonth);

        // CSV Structure
        let csvContent = `CHRONOFLOW STAFFING AGENCY - CANDIDATE BILLING REPORT\n`;
        csvContent += `Candidate Name,"${candidate.name}"\n`;
        csvContent += `Billing Month,"${monthLabel}"\n`;
        csvContent += `Placed Client Company,"${candidate.clientCompany || 'N/A'}"\n`;
        csvContent += `Payroll Hourly Rate,$${(candidate.rate || 0).toFixed(2)}\n\n`;

        csvContent += `Date,Clock In,Clock Out,Total Hours,Location Captured,Work Notes\n`;
        monthlyLogs.forEach(log => {
            const cleanNotes = log.notes ? `"${log.notes.replace(/"/g, '""')}"` : '""';
            const cleanLocation = log.location ? `"${log.location.replace(/"/g, '""')}"` : '""';
            csvContent += `"${log.date}","${log.clockIn}","${log.clockOut}",${log.hours.toFixed(2)},${cleanLocation},${cleanNotes}\n`;
        });

        csvContent += `\n`;
        csvContent += `TOTAL BILLABLE HOURS,,,${totalHours.toFixed(2)}\n`;
        csvContent += `TOTAL BILLABLE AMOUNT,,, "$${totalBillable.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}"\n`;

        // Trigger file download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.setAttribute('href', url);
        link.setAttribute('download', `ChronoFlow_${candidate.name.replace(/\s+/g, '_')}_${yearMonth}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast(`Monthly billing report downloaded for ${candidate.name}!`, 'success');
    }

    function formatMonthYearLabel(yearMonthStr) {
        const parts = yearMonthStr.split('-');
        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    // ==========================================================================
    // 7. MODALS & FORMS MANAGER
    // ==========================================================================

    function openModal(modalEl) {
        modalEl.classList.remove('hidden');
    }

    function closeModal(modalEl) {
        modalEl.classList.add('hidden');
    }

    function openEditLogModal(logId) {
        const log = state.timesheets.find(t => t.id === logId);
        if (!log) return;
        
        // Reset/Setup Modal UI
        document.getElementById('edit-log-id').value = log.id;
        document.getElementById('edit-log-employee').value = log.userId;
        document.getElementById('edit-log-date').value = log.date;
        document.getElementById('edit-log-in').value = log.clockIn;
        document.getElementById('edit-log-out').value = log.clockOut || '';
        document.getElementById('edit-log-notes').value = log.notes || '';
        document.getElementById('edit-log-location').value = log.location || '';
        document.getElementById('edit-log-client').value = log.clientCompany || 'Microsoft';
        
        // Set dynamic headers
        document.getElementById('edit-log-title').innerHTML = `<i data-lucide="edit"></i> Adjust Timesheet Record`;
        document.getElementById('edit-log-employee-container').classList.remove('hidden');
        document.getElementById('edit-log-submit-btn').textContent = 'Save Changes';
        
        lucide.createIcons();
        openModal(elements.modalEditLog);
    }

    function openManualLogModal() {
        // Clear all inputs
        document.getElementById('edit-log-id').value = '';
        document.getElementById('edit-log-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('edit-log-in').value = '09:00:00';
        document.getElementById('edit-log-out').value = '17:00:00';
        document.getElementById('edit-log-notes').value = '';
        document.getElementById('edit-log-location').value = 'HQ Office (Manual)';
        document.getElementById('edit-log-client').value = 'Microsoft';
        
        // Dynamic labels for manual addition
        document.getElementById('edit-log-title').innerHTML = `<i data-lucide="calendar-plus"></i> Add Manual Timesheet Entry`;
        document.getElementById('edit-log-employee-container').classList.remove('hidden');
        document.getElementById('edit-log-submit-btn').textContent = 'Add Entry';
        
        lucide.createIcons();
        openModal(elements.modalEditLog);
    }

    // --- FORM SUBMISSIONS ---

    // Login Form Submit
    elements.loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        elements.loginSubmitBtn.disabled = true;
        const username = elements.loginUsername.value;
        const password = document.getElementById('login-password').value;
        
        // Micro delay to simulate network auth beautifully
        setTimeout(() => {
            login(username, password);
        }, 600);
    });

    // Create Candidate Form Submit
    elements.createEmployeeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const fullname = document.getElementById('emp-fullname').value.trim();
        const username = document.getElementById('emp-username').value.trim().toLowerCase();
        const password = document.getElementById('emp-password').value;
        const role = document.getElementById('emp-role').value;
        const clientCompany = document.getElementById('emp-department').value;
        const rate = parseFloat(document.getElementById('emp-hourly-rate').value);
        
        // Check uniqueness of username
        const userExists = state.users.find(u => u.username === username);
        if (userExists) {
            showToast('Username already taken', 'error');
            return;
        }

        const newUser = {
            id: `u-${Date.now()}`,
            name: fullname,
            username: username,
            password: password,
            role: role,
            clientCompany: clientCompany,
            rate: rate
        };

        state.users.push(newUser);
        saveUsers();
        closeModal(elements.modalCreateEmployee);
        elements.createEmployeeForm.reset();
        
        showToast(`Candidate account created for ${fullname}`, 'success');
        renderAdminDashboard();
    });

    // Edit/Add Log Form Submit
    elements.editLogForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const logId = document.getElementById('edit-log-id').value;
        const userId = document.getElementById('edit-log-employee').value;
        const date = document.getElementById('edit-log-date').value;
        const clockIn = document.getElementById('edit-log-in').value;
        const clockOut = document.getElementById('edit-log-out').value || null;
        const notes = document.getElementById('edit-log-notes').value.trim();
        const location = document.getElementById('edit-log-location').value.trim();
        const clientCompany = document.getElementById('edit-log-client').value;
        
        // Calculate Hours
        let hours = null;
        if (clockOut) {
            const inTime = new Date(`${date}T${clockIn}`);
            const outTime = new Date(`${date}T${clockOut}`);
            let diffHours = (outTime - inTime) / 3600000;
            if (diffHours < 0) diffHours = 0;
            hours = parseFloat(diffHours.toFixed(2));
        }

        if (logId) {
            // EDIT Flow
            const index = state.timesheets.findIndex(t => t.id === logId);
            if (index !== -1) {
                state.timesheets[index] = {
                    ...state.timesheets[index],
                    userId, date, clockIn, clockOut, notes, location, clientCompany, hours
                };
                showToast('Timesheet record updated', 'success');
            }
        } else {
            // MANUAL ADD Flow
            const newLog = {
                id: `log-${Date.now()}`,
                userId, date, clockIn, clockOut, notes, location, clientCompany, hours
            };
            state.timesheets.push(newLog);
            showToast('Manual timesheet entry created', 'success');
        }

        saveTimesheets();
        closeModal(elements.modalEditLog);
        renderAdminDashboard();
    });

    // ==========================================================================
    // 8. EVENT BINDINGS
    // ==========================================================================

    // Log Out click
    elements.logoutBtn.addEventListener('click', logout);

    // Clock In/Out button
    elements.clockActionBtn.addEventListener('click', handleClockAction);

    // Employee Logs Refresh
    elements.empRefreshBtn.addEventListener('click', () => {
        renderEmployeeLogs();
        showToast('Timesheet logs updated', 'success');
    });

    // Admin Dashboard Button events
    elements.adminCreateEmpBtn.addEventListener('click', () => openModal(elements.modalCreateEmployee));
    elements.adminAddLogBtn.addEventListener('click', openManualLogModal);
    elements.adminExportBtn.addEventListener('click', exportFilteredTimesheets);
    elements.adminMonthlyDownloadBtn.addEventListener('click', () => {
        const currentMonth = new Date().toISOString().substring(0, 7);
        elements.monthlyDownloadDate.value = currentMonth;
        openModal(elements.modalMonthlyDownload);
    });

    // Monthly downloader form submit
    elements.monthlyDownloadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userId = elements.monthlyDownloadEmployee.value;
        const yearMonth = elements.monthlyDownloadDate.value;
        exportCandidateMonthlyCSV(userId, yearMonth);
        closeModal(elements.modalMonthlyDownload);
    });

    // Quick metric filters
    elements.statActiveNow.addEventListener('click', () => {
        elements.filterEmployee.value = 'all';
        elements.filterClient.value = 'all';
        showToast('Active clock-ins are shown below.', 'info');
        renderAdminTimesheets();
    });

    // Filter Change Triggers
    elements.filterEmployee.addEventListener('change', renderAdminTimesheets);
    elements.filterClient.addEventListener('change', renderAdminTimesheets);
    elements.filterStartDate.addEventListener('change', renderAdminTimesheets);
    elements.filterEndDate.addEventListener('change', renderAdminTimesheets);
    
    elements.adminClearFilters.addEventListener('click', () => {
        elements.filterEmployee.value = 'all';
        elements.filterClient.value = 'all';
        elements.filterStartDate.value = '';
        elements.filterEndDate.value = '';
        renderAdminTimesheets();
        showToast('Filters cleared', 'info');
    });

    // Close Modals events
    document.querySelectorAll('.btn-close-modal, .btn-close-modal-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            closeModal(e.target.closest('.modal-overlay'));
        });
    });

    // Clicking outside modal content closes the modal
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    });

    // --- HELPER FORMATTING FUNCTIONS ---
    function formatDateFriendly(dateStr) {
        const date = new Date(dateStr);
        // We use UTC conversion tricks to prevent timezone offset discrepancies
        const parts = dateStr.split('-');
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
        return d.toLocaleDateString('en-US', options);
    }

    function formatTime12h(timeStr) {
        if (!timeStr) return '';
        const parts = timeStr.split(':');
        let hours = parseInt(parts[0]);
        const minutes = parts[1];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // hour '0' should be '12'
        return `${hours}:${minutes} ${ampm}`;
    }

    // ==========================================================================
    // 9. APP INITIALIZATION ENTRY POINT
    // ==========================================================================
    initDatabase();
    checkSession();
});

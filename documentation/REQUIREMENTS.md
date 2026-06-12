# SYSTEM REQUIREMENTS SPECIFICATION (SRS)

## 1. Functional Requirements

### 1.1 User Authentication & Session Management
*   **FR-1.1.1:** The system must allow users to log in securely using a username and password.
*   **FR-1.1.2:** The system must identify the user's role (`Admin` or `Employee`) upon login and redirect them to their respective dashboard interface.
*   **FR-1.1.3:** The system must support persistent session management (e.g., using secure tokens or browser cookies).
*   **FR-1.1.4:** Users must be able to log out, terminating their session and redirecting them to the login screen.
*   **FR-1.1.5:** Unauthenticated users must be blocked from accessing dashboard views (`#employee` and `#admin`) and redirected back to `#login`.

### 1.2 Automatic Time Tracking (Employee Flow)
*   **FR-1.2.1:** Employees must only be allowed to record time via the "Clock In" and "Clock Out" actions. Manual direct time entries by employees are prohibited.
*   **FR-1.2.2:** Upon clicking "Clock In", the system must record the current server-validated date and timestamp as the shift start.
*   **FR-1.2.3:** Upon clocking in, the system must request and capture approximate geolocation coordinates (latitude, longitude) and map them to a mock/simulated address label for audit trail purposes.
*   **FR-1.2.4:** While clocked in, a live ticker must display the elapsed time (HH:MM:SS) of the current shift in real-time.
*   **FR-1.2.5:** Upon clicking "Clock Out", the system must prompt the employee for work notes (optional, up to 250 characters), record the clock-out timestamp, and calculate the total shift duration in decimal hours (e.g., 8.25 hours).
*   **FR-1.2.6:** The system must prevent an employee from clocking in if they already have an active (running) clock-in entry.
*   **FR-1.2.7:** Employees must be able to view their personal work logs, sorted from newest to oldest.

### 1.3 Administrator Dashboards & Management
*   **FR-1.3.1:** Admins must have access to a real-time overview panel showing:
    *   The count of employees currently clocked in.
    *   The total number of placed candidates in the database.
    *   The count of active client companies.
*   **FR-1.3.2:** Admins must be able to view a master timesheet list containing logs for all employees.
*   **FR-1.3.3:** Admins must be able to filter timesheet logs by:
    *   Candidate Name (Employee ID)
    *   Client Company
    *   Start Date
    *   End Date
*   **FR-1.3.4:** Admins must be able to add a manual log entry for any employee (for cases where employees forgot to clock in/out). Manual entries require date, clock-in time, clock-out time, work notes, client company, and location label.
*   **FR-1.3.5:** Admins must be able to edit or adjust existing logs (adjust date, check-in time, check-out time, notes, client, or location).
*   **FR-1.3.6:** Admins must be able to permanently delete incorrect timesheet logs.
*   **FR-1.3.7:** Admins must be able to create new employee and administrator accounts, specifying Full Name, Username, Password, Role, Assigned Client Company, and Hourly Rate.

### 1.4 Reporting & Exporting
*   **FR-1.4.1:** The system must allow admins to export the currently filtered master timesheet list as a standard CSV file.
*   **FR-1.4.2:** The system must allow admins to select a candidate and a specific calendar month to download a billing-ready report.
*   **FR-1.4.3:** The monthly report CSV must contain:
    *   Header metadata (Candidate name, month, client company, billing hourly rate).
    *   Itemized daily shift logs (Date, Clock-In, Clock-Out, Total Hours, Notes, Location).
    *   Summary calculations (Total Billed Hours, Total Estimated Billable Amount).

---

## 2. Non-Functional Requirements

### 2.1 Security & Access Control
*   **NFR-2.1.1:** Passwords must be hashed using a secure cryptographic function (e.g., bcrypt) before being stored in the database.
*   **NFR-2.1.2:** Only users with the `Admin` role can invoke routes/endpoints relating to user creation, timesheet deletion, manual adjustments, or multi-user exports.
*   **NFR-2.1.3:** Geolocation capturing should fail gracefully if browser permissions are denied, logging a "Simulated / VPN" tag instead of failing the clock-in action.

### 2.2 Performance & Responsiveness
*   **NFR-2.2.1:** The frontend layout must be fully responsive, scaling cleanly from mobile devices (bottom navigation menu) to desktop screens (top header navigation).
*   **NFR-2.2.2:** Client-side dashboards should load in under 1 second.
*   **NFR-2.2.3:** Database queries on timesheet logs must utilize indexing on `user_id` and `date` to ensure sub-100ms responses.

### 2.3 Reliability & Persistence
*   **NFR-2.3.1:** Active clock-in states must persist across browser tab closures, system reboots, and page reloads.
*   **NFR-2.3.2:** Clock-out calculations must compute using ISO 8601 standard datetime representations to avoid timezone discrepancies.

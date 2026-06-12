# USER ROLES & ACCESS CONTROL: Vergil Tempo

Vergil Tempo enforces a strict Role-Based Access Control (RBAC) model. The system defines two primary roles: **Admin** (Staffing Agency Manager) and **Employee** (Placed Candidate).

---

## 1. Role Descriptions & Flows

### 1.1 Employee (Placed Candidate)
Employees represent the field staff contracted to various client MNCs (e.g., Google, Microsoft). Their interaction is strictly focused on shift tracking and viewing personal history.
*   **Access Scope:** Can only view and edit their own active clock state and logs history. Cannot see other candidates' hours, rates, or statistics.
*   **Standard Workflow:**
    1.  Logs in using credentials provided by the Staffing Manager.
    2.  Arrives at the **Clock Portal** view.
    3.  Clicks **Clock In** at the start of a shift. The system requests GPS location.
    4.  The system begins a running duration timer.
    5.  At the end of the shift, the employee types work notes (optional) and clicks **Clock Out**.
    6.  The shift is calculated and immediately appended to their **Work History** list below.

### 1.2 Admin (Staffing Manager)
Admins manage agency operations, review attendance, and download aggregated billing records.
*   **Access Scope:** Full global read, write, edit, delete, and download access. Can access all candidate lists, billing rates, logs, and stats.
*   **Standard Workflow:**
    1.  Logs in to the admin overview dashboard.
    2.  Reviews real-time charts showing weekly billing hours per client.
    3.  Applies candidate, client, and date filters to search logs.
    4.  Manually adds missed logs or adjusts incorrect logs as reported by employees.
    5.  Downloads CSV reports to submit to clients for billing.
    6.  Adds new candidate profiles as they are recruited.

---

## 2. RBAC Permission Matrix

The following table summarizes the authorization rules. Backend route middleware and frontend UI filters must strictly enforce these permissions.

| Functional Module | Resource / Operation | Employee | Admin |
| :--- | :--- | :---: | :---: |
| **Authentication** | Login, Logout, Session check | ✅ Allow | ✅ Allow |
| **Clock Portal** | Trigger "Clock In" & "Clock Out" | ✅ Allow (Self) | ❌ Denied |
| **Personal Logs** | View personal log history | ✅ Allow (Self) | ✅ Allow (All) |
| **Client Chart** | View Chart.js analytics | ❌ Denied | ✅ Allow |
| **Candidate Accounts**| View all candidate list | ❌ Denied | ✅ Allow |
| | Create new candidate account | ❌ Denied | ✅ Allow |
| | Edit candidate rate / company | ❌ Denied | ✅ Allow |
| **Timesheet Admin** | Add manual log entry | ❌ Denied | ✅ Allow |
| | Edit/Adjust existing log entry | ❌ Denied | ✅ Allow |
| | Delete log entry | ❌ Denied | ✅ Allow |
| **Reports & Exports** | Master CSV Export (Filtered) | ❌ Denied | ✅ Allow |
| | Monthly Candidate CSV Billing Report | ❌ Denied | ✅ Allow |

---

## 3. UI Differences by Role

Upon successful authentication, the frontend dynamically shapes the interface:
1.  **Navigation Links:**
    *   *Employee:* Header displays `Clock Portal`. Bottom nav displays `Clock`, `Refresh`, and `Logout`.
    *   *Admin:* Header displays `Overview`. Bottom nav displays `Overview`, `Create`, `Export`, and `Logout`.
2.  **View Visibility:**
    *   Employees are restricted to `#view-employee` panel. `#view-admin` is hidden.
    *   Admins are restricted to `#view-admin` panel. `#view-employee` is hidden.

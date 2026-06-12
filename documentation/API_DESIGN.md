# API DESIGN SPECIFICATION: Vergil Tempo

This document defines the RESTful API endpoints for the Vergil Tempo backend. All API requests and responses must use JSON format (`Content-Type: application/json`), except file download exports which return `text/csv`.

---

## 1. Authentication Endpoints

### 1.1 Login User
*   **Endpoint:** `POST /api/auth/login`
*   **Access:** Public
*   **Request Body:**
    ```json
    {
      "username": "employee1",
      "password": "emp123"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "u-emp1",
        "name": "John Doe",
        "username": "employee1",
        "role": "employee",
        "clientCompany": "Microsoft",
        "rate": 35.00
      }
    }
    ```
*   **Error Response (401 Unauthorized):**
    ```json
    { "error": "Invalid username or password" }
    ```

### 1.2 Get Current User Session
*   **Endpoint:** `GET /api/auth/me`
*   **Headers:** `Authorization: Bearer <token>`
*   **Access:** Authenticated Users (Admin & Employee)
*   **Success Response (200 OK):**
    ```json
    {
      "id": "u-emp1",
      "name": "John Doe",
      "role": "employee",
      "clientCompany": "Microsoft",
      "rate": 35.00
    }
    ```

### 1.3 Logout User
*   **Endpoint:** `POST /api/auth/logout`
*   **Headers:** `Authorization: Bearer <token>`
*   **Access:** Authenticated Users
*   **Success Response (200 OK):**
    ```json
    { "message": "Logged out successfully" }
    ```

---

## 2. Time Tracking Endpoints (Employee)

### 2.1 Get Active Clock-in Status
Checks if the logged-in employee currently has an uncompleted shift.
*   **Endpoint:** `GET /api/timesheets/active`
*   **Headers:** `Authorization: Bearer <token>`
*   **Access:** Employee
*   **Success Response (200 OK - Active Shift Found):**
    ```json
    {
      "hasActive": true,
      "log": {
        "id": "log-12345",
        "date": "2026-06-12",
        "clockIn": "09:00:00",
        "location": "HQ Boston, MA"
      }
    }
    ```
*   **Success Response (200 OK - No Active Shift):**
    ```json
    { "hasActive": false, "log": null }
    ```

### 2.2 Clock In
Starts a new shift log.
*   **Endpoint:** `POST /api/timesheets/clock-in`
*   **Headers:** `Authorization: Bearer <token>`
*   **Access:** Employee
*   **Request Body:**
    ```json
    {
      "location": "Lat: 42.3601, Lng: -71.0589 (HQ Boston, MA)"
    }
    ```
*   **Success Response (201 Created):**
    ```json
    {
      "message": "Clocked in successfully",
      "log": {
        "id": "log-12345",
        "userId": "u-emp1",
        "date": "2026-06-12",
        "clockIn": "09:00:00",
        "clockOut": null,
        "hours": null,
        "location": "Lat: 42.3601, Lng: -71.0589 (HQ Boston, MA)",
        "clientCompany": "Microsoft"
      }
    }
    ```

### 2.3 Clock Out
Completes the running shift, records notes, and computes total hours.
*   **Endpoint:** `POST /api/timesheets/clock-out`
*   **Headers:** `Authorization: Bearer <token>`
*   **Access:** Employee
*   **Request Body:**
    ```json
    {
      "notes": "Completed redesign drafts for checkout layout."
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "message": "Clocked out successfully",
      "log": {
        "id": "log-12345",
        "clockOut": "17:15:00",
        "hours": 8.25,
        "notes": "Completed redesign drafts for checkout layout."
      }
    }
    ```

### 2.4 Get Personal Log History
Retrieves historical logs for the logged-in employee.
*   **Endpoint:** `GET /api/timesheets/my-logs`
*   **Headers:** `Authorization: Bearer <token>`
*   **Access:** Employee
*   **Success Response (200 OK):**
    ```json
    [
      {
        "id": "log-12345",
        "date": "2026-06-11",
        "clockIn": "08:30:00",
        "clockOut": "17:00:00",
        "hours": 8.50,
        "location": "Remote - Home Office",
        "notes": "Daily tasks completed.",
        "clientCompany": "Microsoft"
      }
    ]
    ```

---

## 3. Administration Endpoints (Admin)

### 3.1 Get Dashboard Statistics
*   **Endpoint:** `GET /api/admin/stats`
*   **Headers:** `Authorization: Bearer <token>`
*   **Access:** Admin
*   **Success Response (200 OK):**
    ```json
    {
      "currentlyClockedIn": 3,
      "totalEmployees": 15,
      "activeClients": 5
    }
    ```

### 3.2 List Master Timesheets (with Filters)
*   **Endpoint:** `GET /api/admin/timesheets`
*   **Headers:** `Authorization: Bearer <token>`
*   **Access:** Admin
*   **Query Parameters:**
    *   `userId` (optional): Filter by specific candidate.
    *   `client` (optional): Filter by client company name.
    *   `startDate` (optional): Format YYYY-MM-DD.
    *   `endDate` (optional): Format YYYY-MM-DD.
*   **Success Response (200 OK):**
    ```json
    [
      {
        "id": "log-98765",
        "userId": "u-emp2",
        "employeeName": "Jane Smith",
        "date": "2026-06-11",
        "clockIn": "09:00:00",
        "clockOut": "18:00:00",
        "hours": 9.00,
        "location": "Google HQ",
        "notes": "Adwords bug investigation",
        "clientCompany": "Google"
      }
    ]
    ```

### 3.3 Create Manual Timesheet Entry
*   **Endpoint:** `POST /api/admin/timesheets`
*   **Headers:** `Authorization: Bearer <token>`
*   **Access:** Admin
*   **Request Body:**
    ```json
    {
      "userId": "u-emp2",
      "date": "2026-06-10",
      "clockIn": "09:00:00",
      "clockOut": "17:30:00",
      "notes": "Manual addition by supervisor",
      "location": "Office (Manual)",
      "clientCompany": "Google"
    }
    ```
*   **Success Response (201 Created):**
    ```json
    { "message": "Manual entry created", "id": "log-manual-99" }
    ```

### 3.4 Adjust Timesheet Record
*   **Endpoint:** `PUT /api/admin/timesheets/:id`
*   **Headers:** `Authorization: Bearer <token>`
*   **Access:** Admin
*   **Request Body:**
    ```json
    {
      "date": "2026-06-10",
      "clockIn": "09:00:00",
      "clockOut": "17:00:00",
      "notes": "Adjusted lunch duration",
      "location": "HQ Office (Adjusted)",
      "clientCompany": "Google"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    { "message": "Timesheet entry adjusted successfully" }
    ```

### 3.5 Delete Timesheet Entry
*   **Endpoint:** `DELETE /api/admin/timesheets/:id`
*   **Headers:** `Authorization: Bearer <token>`
*   **Access:** Admin
*   **Success Response (200 OK):**
    ```json
    { "message": "Timesheet record permanently deleted" }
    ```

### 3.6 Create Candidate/User Account
*   **Endpoint:** `POST /api/admin/users`
*   **Headers:** `Authorization: Bearer <token>`
*   **Access:** Admin
*   **Request Body:**
    ```json
    {
      "name": "Sarah Connor",
      "username": "sconnor",
      "password": "empPassword123",
      "role": "employee",
      "clientCompany": "Meta",
      "rate": 28.00
    }
    ```
*   **Success Response (201 Created):**
    ```json
    { "message": "User account created successfully", "userId": "u-emp9" }
    ```

---

## 4. Report Exports

### 4.1 Export Master Filtered Logs (CSV)
*   **Endpoint:** `GET /api/reports/export-master`
*   **Headers:** `Authorization: Bearer <token>`
*   **Access:** Admin
*   **Query Parameters:** Same as `/api/admin/timesheets` (`userId`, `client`, `startDate`, `endDate`).
*   **Success Response (200 OK):**
    *   Returns a download stream of file type: `text/csv`
    *   Attachment Name: `Vergil Tempo_Timesheets_YYYY-MM-DD.csv`

### 4.2 Export Monthly Candidate Billing Report (CSV)
*   **Endpoint:** `GET /api/reports/export-monthly`
*   **Headers:** `Authorization: Bearer <token>`
*   **Access:** Admin
*   **Query Parameters:**
    *   `userId` (required): Target candidate user ID.
    *   `month` (required): Billing month in YYYY-MM format.
*   **Success Response (200 OK):**
    *   Returns a download stream of file type: `text/csv`
    *   Attachment Name: `Vergil Tempo_<Name>_YYYY-MM.csv`

# DEVELOPMENT ROADMAP & FOLDER STRUCTURE

This roadmap defines the implementation plan to migrate Vergil Tempo from a static frontend mock into a secure, production-ready, full-stack internal timesheet portal.

---

## 1. Recommended Folder Structure
To cleanly separate backend API concerns from public frontend assets while maintaining a lightweight footprint, the following layout is recommended:

```text
Time_sheets/
│
├── public/                     # Frontend Static Assets (Served by Server)
│   ├── index.html              # Main HTML Portal
│   ├── styles.css              # Custom Styling & CSS Variable Tokens
│   ├── app.js                  # Frontend Application Controller (calls REST API)
│   └── assets/                 # Icons, Images, Logos
│
├── src/                        # Backend Application Source Code (Node.js/Express)
│   ├── server.js               # Express Server Entry Point & Initialization
│   │
│   ├── config/
│   │   └── db.js               # Database Connection & Migration Runner
│   │
│   ├── middleware/
│   │   └── authMiddleware.js   # JWT Auth & Role-Based Access Validation
│   │
│   ├── routes/
│   │   ├── authRoutes.js       # Login, Logout, Session endpoints
│   │   ├── timesheetRoutes.js  # Clock-in/out, History, Manual Adjustments
│   │   └── reportRoutes.js     # Master CSV, Monthly Billing Reports
│   │
│   ├── controllers/
│   │   ├── authController.js   # Logic for Authentication
│   │   ├── timesheetController.js # Logic for Shift tracking & adjustments
│   │   └── reportController.js # Logic for formatting & streaming CSV files
│   │
│   └── models/
│       ├── clientModel.js      # Client database helper queries
│       ├── userModel.js        # User database helper queries
│       └── timesheetModel.js   # Timesheet database helper queries
│
├── .env.example                # Template for Server environment variables
├── package.json                # Project dependencies (express, sqlite3/pg, jsonwebtoken, bcrypt)
├── README.md                   # Installation & developer setup instructions
│
└── docs/                       # Project Specifications & Architectures
    ├── PROJECT_SCOPE.md
    ├── REQUIREMENTS.md
    ├── DATABASE_DESIGN.md
    ├── API_DESIGN.md
    └── USER_ROLES.md
```

---

## 2. Phased Implementation Plan

### Phase 1: Setup & Code Reorganization
*   **Goal:** Reorganize the existing workspace into the clean folder structure, initialize npm, and install dependencies.
*   **Tasks:**
    1.  Create `public/` and `src/` directories.
    2.  Move current `index.html`, `styles.css`, and `app.js` into the `public/` folder.
    3.  Run `npm init -y` to initialize `package.json`.
    4.  Install dependencies: `express`, `cors`, `dotenv`, `bcryptjs`, `jsonwebtoken`, and `sqlite3` (for development database).
    5.  Set up backend routing structure in `src/routes/`.

### Phase 2: Database & Core Server Setup
*   **Goal:** Establish database connection, define tables, and run migrations.
*   **Tasks:**
    1.  Create `src/config/db.js` to initialize the SQLite database using the SQL DDL schema.
    2.  Write seeding scripts to insert initial MNC clients (Microsoft, Google, Meta, Amazon, Netflix) and default user accounts (one admin, several employees).
    3.  Develop basic models in `src/models/` to query data.
    4.  Build the Express server in `src/server.js` and test database connectivity.

### Phase 3: REST API Development & Auth
*   **Goal:** Implement server endpoints, JWT session signing, and auth middleware validation.
*   **Tasks:**
    1.  Create login routes and use `bcryptjs` to compare hashed passwords.
    2.  Create token issuance (`jsonwebtoken`) and store tokens or cookies.
    3.  Write `authMiddleware.js` to protect endpoints, extracting user IDs and validating Roles.
    4.  Create timesheet routes for Clock-in, Clock-out, active checks, history, manual logs addition, and edits.
    5.  Verify API responses using tools like Postman, curl, or automated test scripts.

### Phase 4: Frontend API Integration
*   **Goal:** Link frontend GUI events to backend REST API endpoints, moving away from `localStorage`.
*   **Tasks:**
    1.  Refactor `public/app.js` to replace LocalStorage operations with `fetch()` calls containing JWT authorization headers.
    2.  Integrate login form to store token in memory or cookies.
    3.  Update Clock-in/out event handlers to post to `/api/timesheets/clock-in` and `/api/timesheets/clock-out`.
    4.  Replace local array sorting and rendering with backend-filtered query lists (`/api/admin/timesheets`).
    5.  Integrate user creation form to register new candidates dynamically.

### Phase 5: Reporting Engine & Testing
*   **Goal:** Implement reports generation and verify business constraints.
*   **Tasks:**
    1.  Write controllers in `src/controllers/reportController.js` to compile filtered query outputs into raw CSV strings.
    2.  Build download routes `/api/reports/export-master` and `/api/reports/export-monthly` that stream CSV files to the client.
    3.  Verify the calculations: check that the monthly billing amount matches `hours * user.hourly_rate`.
    4.  Perform boundary testing: verify that an employee cannot edit timesheets, view another candidate's dashboard, or access admin-only statistics.

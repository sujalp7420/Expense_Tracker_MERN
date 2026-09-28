# Smart Finance Hub - Frontend

A modern, responsive React + Vite web application for personal finance, expense tracking, income management, budget alerts, and analytical reporting.

## Features
- **Authentication**: JWT-based User Registration, Login, and Profile Management.
- **Dashboard**: Financial overview, KPI cards (Income, Expenses, Savings, Savings Rate), budget watchlist, and recent transactions.
- **Expenses**: Full CRUD support for recording expenses with categories, payment methods, notes, and search/filter.
- **Income**: Full CRUD support for tracking earnings and revenue streams.
- **Budgets**: Category-based budget limits with visual progress meters and customizable alert thresholds (e.g. 80%).
- **Reports & Analytics**: Monthly and yearly breakdown, category expense distribution, database ledger snapshots, and CSV export.
- **Preferences**: User currency preferences (INR, USD, EUR, GBP, AUD, CAD, JPY).

## Getting Started

### 1. Start the Backend
In the `backend` folder:
```bash
npm start
# Server runs on http://localhost:5000
```

### 2. Start the Frontend
In the `frontend` folder:
```bash
npm run dev
# Frontend runs on http://localhost:5173
```

The Vite dev server automatically proxies `/api` requests to `http://localhost:5000`.

### 3. Production Build
```bash
npm run build
```

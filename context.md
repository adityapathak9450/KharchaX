# KharchaX — Project Context File
> READ THIS ENTIRE FILE BEFORE WRITING A SINGLE LINE OF CODE.
> This is the single source of truth for the entire project.
> Updated after: Phase 4 complete.

---

## What Is This Project?

**KharchaX** is a premium, startup-level MERN SaaS Finance Management Platform.
Think Stripe Dashboard meets Notion — clean, dark, professional.

Users can:
- Track expenses and income across multiple wallets
- Create monthly budgets with overspending alerts
- Analyze spending visually with charts and heatmaps
- Manage recurring payments and subscriptions
- Share wallets with friends/team and split expenses
- Generate and download monthly PDF/CSV reports
- Get real-time notifications via Socket.io

This is NOT a simple expense tracker.
It is a **financial workspace** — built to showcase advanced MERN skills.

---

## Current Build Status

| Phase | Feature | Status |
|-------|---------|--------|
| Phase 1 | Project Setup, Folder Structure, All Configs | ✅ DONE |
| Phase 2 | All 10 Mongoose Database Models | ✅ DONE |
| Phase 3 | Auth Backend (JWT, Refresh Tokens, Email OTP) | ✅ DONE |
| Phase 4 | Auth Frontend (Login, Register, OTP, Forgot/Reset Password) | ✅ DONE |
| Phase 5 | Dashboard Layout + Dashboard Page + Charts | ⏳ NOT STARTED |
| Phase 6 | Transactions System (Full CRUD, Filters, CSV) | ⏳ NOT STARTED |
| Phase 7 | Wallets System + Budget Management | ⏳ NOT STARTED |
| Phase 8 | Analytics + Reports (PDF/CSV generation) | ⏳ NOT STARTED |
| Phase 9 | Shared Wallets + Recurring Payments | ⏳ NOT STARTED |
| Phase 10 | Notifications + Settings + Final Polish | ⏳ NOT STARTED |

---

## Tech Stack — Exact Versions

### Frontend (inside /client)
```
React 18 + Vite
Tailwind CSS v3
Framer Motion
Zustand (state management)
TanStack Query v5 (React Query)
React Router DOM v6
Recharts (charts)
React Hook Form + Zod (forms + validation)
Lucide React (icons)
React Hot Toast (notifications)
Axios (HTTP client)
Day.js (date formatting)
TanStack Table v8
react-beautiful-dnd (drag and drop)
next-themes (theme)
socket.io-client
```

### Backend (inside /server)
```
Node.js + Express.js
MongoDB + Mongoose
JWT (jsonwebtoken) + bcrypt
Zod (validation)
Socket.io
Multer + Cloudinary (file uploads)
Nodemailer (emails)
Helmet + CORS + express-rate-limit (security)
Morgan (logging)
PDFKit (PDF generation)
csv-parser (CSV parsing)
dotenv
```

---

## Folder Structure

### Frontend: /client/src/
```
app/              → App.jsx, main entry
assets/           → images, svgs
components/       → reusable UI components
  layout/         → Sidebar.jsx, Header.jsx
  ui/             → Button, Input, Modal, Skeleton, Badge etc
  transactions/   → TransactionModal, FilterPanel, CSVImportModal
  wallets/        → WalletCard, WalletModal, TransferModal
  budgets/        → BudgetCard, BudgetModal
  analytics/      → SpendingHeatmap, chart components
features/         → feature-specific logic (if any)
hooks/            → all custom hooks (useAuth, useDashboard, useTransactions etc)
layouts/          → DashboardLayout.jsx, AuthLayout.jsx
pages/            → one file per page
  auth/           → LoginPage, RegisterPage, VerifyEmailPage, ForgotPasswordPage, ResetPasswordPage
  DashboardPage.jsx
  TransactionsPage.jsx
  WalletsPage.jsx
  WalletDetailPage.jsx
  BudgetsPage.jsx
  AnalyticsPage.jsx
  ReportsPage.jsx
  SettingsPage.jsx
routes/           → index.jsx (all route definitions)
services/         → API call functions (if not in hooks)
store/            → Zustand stores
  authStore.js    → ✅ EXISTS — DO NOT RECREATE
  budgetStore.js  → for drag and drop order persistence
context/          → React contexts if needed
utils/            → helper functions
constants/        → app-wide constants
lib/
  axios.js        → ✅ EXISTS — DO NOT RECREATE
  queryClient.js  → TanStack Query client config
styles/
  globals.css     → ✅ EXISTS — CSS variables defined here
animations/       → Framer Motion variants
```

### Backend: /server/src/
```
config/
  db.js           → ✅ EXISTS — MongoDB connection
  cloudinary.js   → Cloudinary config
controllers/
  auth.controller.js        → ✅ EXISTS
  dashboard.controller.js   → to be created in Phase 5
  transaction.controller.js → to be created in Phase 6
  wallet.controller.js      → to be created in Phase 7
  budget.controller.js      → to be created in Phase 7
  analytics.controller.js   → to be created in Phase 8
  report.controller.js      → to be created in Phase 8
services/
  budget.service.js         → to be created in Phase 7
  report.service.js         → to be created in Phase 8
repositories/               → DB query abstraction (optional)
middleware/
  auth.middleware.js        → ✅ EXISTS — authenticate, optionalAuth
  error.middleware.js       → ✅ EXISTS — global error handler
models/
  User.model.js             → ✅ EXISTS
  Wallet.model.js           → ✅ EXISTS
  Transaction.model.js      → ✅ EXISTS
  Budget.model.js           → ✅ EXISTS
  RecurringPayment.model.js → ✅ EXISTS
  SharedWallet.model.js     → ✅ EXISTS
  Notification.model.js     → ✅ EXISTS
  Category.model.js         → ✅ EXISTS
  ActivityLog.model.js      → ✅ EXISTS
  Report.model.js           → ✅ EXISTS
routes/
  auth.routes.js            → ✅ EXISTS
  dashboard.routes.js       → to be created Phase 5
  transaction.routes.js     → to be created Phase 6
  wallet.routes.js          → to be created Phase 7
  budget.routes.js          → to be created Phase 7
  analytics.routes.js       → to be created Phase 8
  report.routes.js          → to be created Phase 8
validators/
  auth.validator.js         → ✅ EXISTS
  transaction.validator.js  → to be created Phase 6
sockets/                    → Socket.io event handlers
utils/                      → helper functions
jobs/
  seedCategories.js         → ✅ EXISTS — seeds default categories on start
events/                     → event emitters
helpers/
  emailTemplates.js         → ✅ EXISTS
constants/
  categories.js             → ✅ EXISTS
```

---

## What Was Built in Phase 1–4 (Do NOT Touch These)

### Phase 1 — Project Setup
- Full monorepo with /client (React+Vite) and /server (Node+Express)
- Tailwind CSS configured with custom design tokens
- All npm packages installed (see Tech Stack above)
- ESLint configured
- Environment variable files (.env.example for both)
- Root package.json with concurrent dev script

### Phase 2 — Database Models
All 10 Mongoose models created with full schemas, validations, indexes:
- **User** — name, email, password (bcrypt), avatar, isVerified, verifyToken, refreshTokens[], currency, theme, preferences
- **Wallet** — name, type, balance, color, icon, userId, isShared, members[], currency
- **Transaction** — amount, type (income/expense), category, wallet, userId, tags[], notes, date, attachments[], isRecurring
- **Budget** — name, amount (limit), spent, category, userId, month, year, alertAt (%), isExceeded
- **RecurringPayment** — name, amount, type, category, wallet, userId, frequency, nextDueDate, isActive
- **SharedWallet** — name, walletId, createdBy, members[], inviteCode, expenses[]
- **Notification** — userId, title, message, type, isRead, relatedId
- **Category** — name, icon, color, type (income/expense/both), isDefault, userId
- **ActivityLog** — userId, action, entity, entityId, metadata, ip
- **Report** — userId, type, period, fileUrl, status, filters
- Default categories seeded: Food, Shopping, Travel, Bills, Salary, Investments, Entertainment, Healthcare, Freelance, Others

### Phase 3 — Auth Backend (ALL routes under /api/auth/)
- POST /register — Zod validation, bcrypt hash, 6-digit OTP email
- POST /login — verify credentials + isVerified check, issue accessToken + refreshToken
- POST /logout — remove refreshToken from DB, clear cookie
- POST /refresh-token — rotate refresh token (sliding window), issue new access token
- POST /verify-email — OTP match + expiry check, set isVerified=true
- POST /resend-verification — resend OTP email
- POST /forgot-password — crypto random reset link, 1hr expiry
- POST /reset-password — verify token, update password, clear all refresh tokens
- GET /me — protected, returns user without password
- PUT /update-profile — protected, update name/avatar/currency/theme

### Phase 4 — Auth Frontend (ALL pages under /pages/auth/)
- LoginPage.jsx — email + password, show/hide toggle, remember me
- RegisterPage.jsx — name + email + password, strength indicator, terms checkbox
- VerifyEmailPage.jsx — 6 OTP boxes, auto-focus, paste support, 60s resend timer
- ForgotPasswordPage.jsx — email input, success state
- ResetPasswordPage.jsx — new password + confirm, strength indicator, success redirect
- authStore.js (Zustand) — user, accessToken (memory only), isAuthenticated
- axios.js — interceptors for auto token refresh on 401
- ProtectedRoute.jsx — redirects to /login if not authenticated
- routes/index.jsx — lazy loaded routes, auth + protected route structure

---

## Critical Architecture Rules
> These must NEVER be violated. If unsure, ask — do not guess.

### 1. Token Storage
- `accessToken` → stored in **Zustand memory ONLY** (never localStorage, never sessionStorage)
- `refreshToken` → stored in **httpOnly cookie ONLY** (server sets it)
- On page refresh: Zustand loses accessToken → axios interceptor hits /refresh-token → gets new accessToken from cookie → continues normally

### 2. API Response Format
Every single API response MUST follow this exact format:
```js
// Success
res.json({ success: true, message: "...", data: { ... } })

// Error
res.json({ success: false, message: "...", errors: { ... } })  // or use next(error)
```
Never deviate from this format. Frontend depends on `response.data.data` for payload.

### 3. Axios Instance
The axios instance at `client/src/lib/axios.js` already has:
- baseURL set to VITE_API_URL
- Request interceptor: attaches `Authorization: Bearer {accessToken}`
- Response interceptor: on 401, calls /refresh-token, retries request, on second 401 logs out
**NEVER create another axios instance. Always import from `client/src/lib/axios.js`**

### 4. Auth Middleware
`server/src/middleware/auth.middleware.js` exports:
- `authenticate` — required auth, returns 401 if no valid token
- `optionalAuth` — attaches user if token exists, continues either way
**Always use `authenticate` middleware on protected routes. Never re-implement JWT verification.**

### 5. Error Handling
All server errors go through `next(error)` to the global error handler in `error.middleware.js`.
Use the custom `AppError` class: `throw new AppError("message", statusCode)`
Never use `res.status(500).json(...)` directly in controllers — use next(error).

### 6. Wallet Balance
Wallet balance is ALWAYS computed server-side.
Formula: `balance = initialBalance + SUM(income transactions) - SUM(expense transactions)`
Never let the frontend send a balance directly. Always recalculate after transaction mutations.

### 7. Budget Alerts
After EVERY transaction create/update, if type=expense:
Call `budgetService.checkBudgets(userId, categoryId, month, year)`
This checks budget limits and emits socket events + creates notifications if exceeded.

---

## Design System

### Theme
- **Mode:** Dark only (for now)
- **Primary/Accent:** `#6366f1` (Indigo)
- **Font:** System UI / Inter

### CSS Variables (defined in globals.css)
```css
:root {
  --surface: #0f0f0f;      /* page background */
  --surface-2: #1a1a1a;   /* card background */
  --surface-3: #262626;   /* elevated elements */
  --border: rgba(255,255,255,0.08);
  --text-primary: #ffffff;
  --text-secondary: #a1a1aa;
  --accent: #6366f1;
}
```

### Component Classes (use these consistently)
```
Card:         bg-[#1a1a1a] border border-white/[0.08] rounded-2xl p-6
Card hover:   hover:border-white/20 transition-all
Input:        bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500
Button primary:  bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition-all
Button ghost:    bg-transparent hover:bg-white/5 text-gray-400 hover:text-white rounded-xl px-4 py-2 text-sm transition-all
Badge green:  bg-green-500/10 text-green-400 text-xs px-2 py-0.5 rounded-full
Badge red:    bg-red-500/10 text-red-400 text-xs px-2 py-0.5 rounded-full
Badge indigo: bg-indigo-500/10 text-indigo-400 text-xs px-2 py-0.5 rounded-full
```

### Chart Colors (Recharts)
```js
const CHART_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']
```

### Chart Base Config (apply to all Recharts)
```jsx
<CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
<XAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
<YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
// Tooltip: custom dark component (bg-[#262626] border border-white/10 rounded-xl p-3)
```

### Currency
- Symbol: `₹` (Indian Rupee)
- Format: `amount.toLocaleString('en-IN')` → outputs `1,00,000`
- Always show ₹ prefix

---

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| React components | PascalCase | `TransactionModal.jsx` |
| Custom hooks | camelCase with "use" prefix | `useTransactions.js` |
| Zustand stores | camelCase with "Store" suffix | `authStore.js` |
| API route files | kebab-case | `transaction.routes.js` |
| Controller files | camelCase | `transaction.controller.js` |
| API endpoints | plural, kebab | `/api/transactions`, `/api/shared-wallets` |
| Mongoose models | PascalCase with Model suffix | `Transaction.model.js` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_FILE_SIZE` |

---

## Environment Variables

### /client/.env
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### /server/.env
```
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
CLIENT_URL=http://localhost:5173
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

---

## Auth Flow (How It Works End to End)

```
1. User logs in → POST /api/auth/login
2. Server returns: accessToken (in JSON body) + sets refreshToken (httpOnly cookie)
3. Frontend: stores accessToken in Zustand (memory), stores user in Zustand
4. Every API request: axios interceptor adds "Authorization: Bearer {accessToken}"
5. accessToken expires in 15min → server returns 401
6. axios response interceptor catches 401 → calls POST /api/auth/refresh-token
7. Server reads refreshToken from cookie → issues new accessToken + rotates refreshToken
8. axios retries original request with new accessToken
9. On logout: DELETE refreshToken from DB + clear cookie + clear Zustand store
10. On page refresh: Zustand resets (memory cleared) → axios makes any request → gets 401 → refresh-token call restores session from cookie
```

---

## Socket.io Architecture

Server emits these events to specific user rooms (`userId.toString()`):
```
budget:alert     → when spending reaches alertAt% of budget
budget:exceeded  → when spending goes over 100% of budget
report:ready     → when PDF/CSV report generation completes
report:failed    → when report generation fails
notification:new → for any new notification created
```

Frontend connects socket in `DashboardLayout.jsx` using `useSocket()` hook.
Socket authenticates using accessToken passed in `auth` option.

---

## What Comes Next (Not Built Yet)

After completing Phases 5–8, these remain:

**Phase 9 — Shared Wallets + Recurring Payments**
- Invite members via invite code
- Role-based permissions (Owner/Editor/Viewer)
- Expense splitting and settlement calculation
- Recurring payment scheduling with due date alerts
- Auto-create future transactions for recurring payments

**Phase 10 — Notifications + Settings + Polish**
- Full notification center (mark read, filter by type)
- Settings page (profile, currency, theme, notification preferences)
- Bank statement CSV import with auto-categorization
- Final animations, loading states, empty states polish
- Mobile responsiveness audit

---

## Rules for the AI Working on This Project

1. **READ this file every session before writing any code**
2. **NEVER modify Phase 1–4 files** unless explicitly told to (auth system, models, base config)
3. **ALWAYS check if a file exists** before creating it — don't duplicate
4. **NEVER create a new axios instance** — import from `client/src/lib/axios.js`
5. **NEVER recreate auth logic** — use existing authStore and auth middleware
6. **NEVER install a package** without listing it first and confirming it's not already installed
7. **ALWAYS follow the API response format**: `{ success, message, data?, errors? }`
8. **ALWAYS use dark theme classes** — no light mode assumptions
9. **ALWAYS format currency** as `₹{amount.toLocaleString('en-IN')}`
10. **IF UNSURE about existing code** → ASK, do not assume and hallucinate
11. **ONE feature at a time** — complete and verify before moving to next
12. **Register every new route** in the Express app (app.js or index.js) — don't forget this

---

| Phase 5  | Dashboard Layout + Dashboard Page + Charts    | ✅ DONE |
| Phase 6  | Transactions System (Full CRUD, Filters, CSV) | ✅ DONE |
| Phase 7  | Wallets System + Budget Management            | ✅ DONE |
| Phase 8  | Analytics + Reports (PDF/CSV generation)      | ✅ DONE |


## Current Status
All 8 phases complete. App is functional.
Now in: Bug fixing + Polish mode.
Tool: Windsurf


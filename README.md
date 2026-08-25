# Secure React + Node.js App

A production-ready starter with JWT auth, no secrets in the frontend.

---

## Project layout

```
secure-app/
├── backend/          ← Node.js + Express (all secrets here)
│   ├── .env.example  ← copy to .env and fill in your values
│   └── src/
│       ├── config/   ← env validation, MongoDB connection
│       ├── middleware/← security, auth, error handler
│       ├── models/   ← Mongoose User model
│       ├── routes/   ← auth endpoints
│       ├── utils/    ← JWT helpers, logger, response helpers
│       └── validators/← express-validator rules
└── frontend/         ← React (NO secrets, only JWT token)
    ├── .env.example  ← copy to .env — safe values only
    └── src/
        ├── api/      ← Axios client + auth API calls
        ├── context/  ← AuthContext (global auth state)
        ├── pages/    ← Login, Register, Dashboard
        ├── components/← ProtectedRoute
        └── utils/    ← token helpers (localStorage)
```

---

## Quick start

### 1 — Backend

```bash
cd backend
cp .env.example .env        # then edit .env with your real values
npm install
npm run dev                 # starts on http://localhost:5000
```

**Edit `backend/.env`:**
```
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/DBNAME
JWT_SECRET=some-very-long-random-string-at-least-32-chars
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000
```

### 2 — Frontend

```bash
cd frontend
cp .env.example .env        # only has REACT_APP_API_URL and REACT_APP_NAME
npm install
npm start                   # starts on http://localhost:3000
```

---

## API endpoints

| Method | Endpoint            | Auth required | Description          |
|--------|---------------------|---------------|----------------------|
| POST   | /api/auth/register  | No            | Create account       |
| POST   | /api/auth/login     | No            | Login, get JWT       |
| GET    | /api/auth/me        | Yes (Bearer)  | Get current user     |
| GET    | /health             | No            | Health check         |

---

## Security features in place

| Feature              | Where                                  |
|----------------------|----------------------------------------|
| Helmet HTTP headers  | `backend/src/middleware/security.js`   |
| CORS whitelist       | `backend/src/middleware/security.js`   |
| Rate limiting        | Global (100/15 min) + auth (10/15 min) |
| NoSQL injection      | express-mongo-sanitize                 |
| Input validation     | express-validator on all auth routes   |
| Password hashing     | bcrypt, cost factor 12                 |
| JWT secret on server | `backend/.env` only                    |
| Secret-free frontend | Frontend `.env` has no secrets         |
| Logger scrubbing     | Passwords/tokens redacted in logs      |
| Global error handler | Never exposes stack traces in prod     |

---

## Migrating your existing frontend secrets

| Old frontend var            | Action                                      |
|-----------------------------|---------------------------------------------|
| `REACT_APP_MONGODB_URI`     | Move to `backend/.env` as `MONGODB_URI`     |
| `REACT_APP_JWT_SECRET`      | Move to `backend/.env` as `JWT_SECRET`      |
| `REACT_APP_API_KEY`         | Move to `backend/.env`, call 3rd-party from backend |
| `REACT_APP_STRIPE_SECRET`   | Move to `backend/.env`; use public key only in frontend |
| `REACT_APP_API_URL`         | ✅ Safe to keep — it's just a URL, not a secret |
| `REACT_APP_NAME`            | ✅ Safe to keep — cosmetic only              |

**Rule of thumb:** If losing the value would compromise security → backend only.

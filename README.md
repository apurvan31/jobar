# job.bar — Full-Stack Setup Guide

## 📁 Project Structure

```
p/
├── index.html          ← Frontend (existing, now connected to backend)
├── css/                ← Stylesheets (unchanged)
├── js/
│   ├── data.js         ← Mock data fallback
│   ├── app.js          ← Core UI logic
│   ├── jobs.js         ← Job feed UI
│   ├── applications.js ← Applications tracker UI
│   ├── resume.js       ← Resume lab UI
│   ├── ai.js           ← AI features UI
│   ├── autoapply.js    ← Auto-apply UI
│   ├── salary.js       ← Salary insights UI
│   ├── prep.js         ← Interview prep UI
│   └── api.js          ← ⭐ NEW: API bridge (connects frontend → backend)
└── backend/
    ├── server.js           ← Express + Socket.io entry
    ├── .env                ← Environment variables
    ├── config/
    │   ├── db.js           ← MongoDB connection
    │   └── passport.js     ← JWT + Google OAuth
    ├── models/
    │   ├── User.js         ← User schema
    │   ├── Job.js          ← Job schema
    │   ├── Application.js  ← Application tracking
    │   ├── SavedJob.js     ← Saved jobs
    │   ├── Resume.js       ← Resume + parsed data
    │   └── Analytics.js    ← Visit & usage analytics
    ├── routes/
    │   ├── auth.js         ← POST /api/auth/* (signup, login, google)
    │   ├── users.js        ← GET/PUT /api/users/*
    │   ├── jobs.js         ← GET /api/jobs
    │   ├── applications.js ← CRUD /api/applications
    │   ├── resumes.js      ← POST /api/resumes/upload
    │   ├── ai.js           ← POST /api/ai/*
    │   ├── savedJobs.js    ← GET/POST/DELETE /api/saved-jobs
    │   ├── autoApply.js    ← POST /api/autoapply/start
    │   └── admin.js        ← /api/admin/* (protected)
    ├── middleware/
    │   ├── auth.js         ← JWT protect middleware
    │   ├── upload.js       ← Multer file upload
    │   └── analytics.js    ← Request tracking
    ├── services/
    │   ├── aiService.js    ← OpenAI integration (with mock fallback)
    │   ├── resumeParser.js ← PDF/DOCX parser
    │   └── jobFetcher.js   ← RapidAPI + mock job seeder
    ├── utils/
    │   └── logger.js       ← Winston logger
    └── scripts/
        └── seed.js         ← Database seeder
```

---

## 🚀 Local Development Setup

### Prerequisites

| Requirement | Version | Install |
|-------------|---------|---------|
| Node.js | ≥ 18.0 | https://nodejs.org |
| MongoDB | ≥ 6.0 | https://www.mongodb.com/try/download/community |
| Git | any | https://git-scm.com |

---

### Step 1 — Install MongoDB (Windows)

**Option A: MongoDB Community Server (recommended)**
1. Download from https://www.mongodb.com/try/download/community
2. Install with defaults (includes MongoDB Compass GUI)
3. Start: `net start MongoDB`  or it auto-starts as a Windows service

**Option B: via winget**
```powershell
winget install MongoDB.Server
```

**Option C: MongoDB Atlas (cloud, no local install)**
1. Go to https://cloud.mongodb.com → Create free cluster
2. Get connection string → paste into `backend/.env` as `MONGODB_URI`

---

### Step 2 — Configure Environment

Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5500

# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/jobbar
# OR Atlas: mongodb+srv://user:pass@cluster.mongodb.net/jobbar

JWT_SECRET=jobbar_jwt_secret_2024_change_in_production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=jobbar_refresh_secret_2024_change_in_production

# Optional - leave as-is to use mock responses
OPENAI_API_KEY=sk-your-openai-api-key

# Optional - jobs auto-seeded without this
RAPIDAPI_KEY=your_rapidapi_key

# Optional - leave as-is to skip Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

> **Note:** The app works WITHOUT OpenAI/RapidAPI keys — it falls back to mock AI responses and pre-seeded jobs automatically.

---

### Step 3 — Start MongoDB

```powershell
# Windows Service (if installed as service)
net start MongoDB

# OR manual start
mongod --dbpath "C:\data\db"
```

---

### Step 4 — Install & Start Backend

```powershell
cd backend
npm install
npm run seed       # Seeds 15 mock jobs into database
npm run dev        # Starts backend on http://localhost:5000
```

You should see:
```
🚀 job.bar backend running on port 5000
✅ MongoDB connected: localhost
📡 Socket.io ready
```

---

### Step 5 — Open Frontend

Open `index.html` in a browser via **Live Server** (VS Code extension) or:

```powershell
# Using npx serve
npx serve . -p 5500
```

Then go to: **http://localhost:5500**

> The frontend auto-connects to the backend at `http://localhost:5000`

---

## 🌐 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Email/password login |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/refresh` | Refresh JWT token |
| GET | `/api/auth/google` | Google OAuth login |
| GET | `/api/auth/me` | Get current user |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs` | List jobs (with filters) |
| GET | `/api/jobs/:id` | Get single job |
| POST | `/api/jobs/fetch-live` | Fetch live from RapidAPI |

### Applications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/applications` | Get all (with stats) |
| POST | `/api/applications` | Track new application |
| PUT | `/api/applications/:id` | Update status |
| DELETE | `/api/applications/:id` | Remove |
| GET | `/api/applications/export/csv` | Export CSV |

### Resumes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/resumes` | List resumes |
| POST | `/api/resumes/upload` | Upload PDF/DOCX |
| GET | `/api/resumes/:id` | Get resume + parsed data |
| PUT | `/api/resumes/:id/set-active` | Set as active resume |
| DELETE | `/api/resumes/:id` | Delete |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/optimize-resume` | ATS optimization |
| POST | `/api/ai/cover-letter` | Generate cover letter |
| POST | `/api/ai/interview-prep` | Interview Q&A |
| POST | `/api/ai/match-jobs` | Match jobs to skills |
| POST | `/api/ai/chat` | AI career assistant chat |
| POST | `/api/ai/analyze-job` | Job fit analysis |

### Saved Jobs & Auto Apply
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/saved-jobs` | List saved jobs |
| POST | `/api/saved-jobs/:jobId` | Save job |
| DELETE | `/api/saved-jobs/:jobId` | Unsave |
| POST | `/api/saved-jobs/actions/auto-apply-all` | Apply to all saved |
| POST | `/api/autoapply/start` | Start auto-apply queue |
| GET | `/api/autoapply/history` | Auto-apply history |

### Admin (requires admin role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Platform statistics |
| GET | `/api/admin/users` | All users |
| GET | `/api/admin/analytics` | Usage analytics |

---

## 📡 Real-Time Events (Socket.io)

Connect to `http://localhost:5000` and join your user room:

```js
socket.emit('join-user-room', userId);
```

| Event | Triggered When |
|-------|---------------|
| `application-added` | New application tracked |
| `application-status-updated` | Status changed |
| `resume-parsed` | Resume fully parsed |
| `autoapply-progress` | Each job processed |
| `autoapply-complete` | Queue finished |
| `auto-apply-complete` | Saved jobs auto-applied |

---

## 🌍 Production Deployment

### Deploy Backend to Render

1. Push `backend/` folder to GitHub
2. Go to https://render.com → New Web Service
3. Connect your repo, set **Root Directory** to `backend`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add all env vars from `.env` in Render dashboard
7. For MongoDB: use **MongoDB Atlas** free tier

### Deploy Frontend to Vercel / Netlify

1. Update `index.html` — change the backend URL:
```html
<script>
  window.JB_API_BASE = 'https://your-backend.onrender.com/api';
  window.JB_SOCKET_URL = 'https://your-backend.onrender.com';
</script>
```
2. Push the root `p/` folder to GitHub
3. Deploy to Vercel: `npx vercel`

### Environment Variables for Production

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/jobbar
JWT_SECRET=<strong-random-64-char-string>
JWT_REFRESH_SECRET=<another-strong-random-64-char-string>
FRONTEND_URL=https://your-frontend.vercel.app
```

---

## 🔑 Getting API Keys

### OpenAI (for AI features)
1. https://platform.openai.com → API Keys → Create
2. Add `OPENAI_API_KEY=sk-...` to `.env`
3. Without key: all AI features return high-quality mock responses ✅

### RapidAPI / JSearch (for live jobs)
1. https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
2. Subscribe to free tier (200 req/month)
3. Add `RAPIDAPI_KEY=...` to `.env`
4. Without key: 15 pre-seeded Indian/global tech jobs ✅

### Google OAuth
1. https://console.cloud.google.com → APIs → Credentials → OAuth 2.0
2. Authorized redirect: `http://localhost:5000/api/auth/google/callback`
3. Without key: Google sign-in button is hidden ✅

---

## ✅ What's Wired Up

| Feature | Frontend → Backend |
|---------|-------------------|
| Sign up / Sign in | ✅ Real JWT auth |
| Google OAuth | ✅ (with key) |
| Job feed | ✅ Loaded from MongoDB |
| Job filters | ✅ Server-side filtering |
| Save/Unsave jobs | ✅ Persisted to DB |
| Track applications | ✅ Full CRUD |
| Application status | ✅ Real-time via Socket.io |
| Resume upload | ✅ PDF/DOCX parsed |
| Resume skills extraction | ✅ Auto-updates profile |
| AI cover letter | ✅ OpenAI (or mock) |
| AI interview prep | ✅ OpenAI (or mock) |
| Auto-apply engine | ✅ Real-time progress events |
| Notifications | ✅ Real-time Socket.io |
| CSV export | ✅ API endpoint |
| Profile save | ✅ Persisted to DB |
| Analytics tracking | ✅ Every API call logged |
| Admin dashboard | ✅ /api/admin/* |

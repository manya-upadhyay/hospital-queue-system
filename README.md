# 🏥 AI-Based Smart Hospital Queue Management System

A production-ready, cloud-based intelligent hospital queue optimization platform built with microservices architecture.

## 🎯 Overview

Reduces patient waiting time, eliminates overcrowding, and improves operational efficiency using Machine Learning predictions and real-time queue management.

---

## 🏗 Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   React Frontend│    │  Node.js Backend  │    │ Python ML Service   │
│  (Vercel)       │◄──►│  (Render)         │◄──►│ (Render)            │
│                 │    │  Express + Socket │    │ FastAPI + sklearn   │
└─────────────────┘    └────────┬─────────┘    └─────────────────────┘
                                │
                       ┌────────▼─────────┐
                       │  PostgreSQL DB   │
                       │  (Supabase)      │
                       └──────────────────┘
```

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, Recharts, Socket.io-client |
| Backend | Node.js, Express, Socket.io, JWT |
| ML Service | Python, FastAPI, scikit-learn |
| Database | PostgreSQL (Supabase) |
| Auth | JWT + bcrypt |
| Deployment | Vercel + Render + Supabase |

---

## 🧠 Priority Algorithm

```
Priority Score =
  (Emergency × 100) +
  (Age Factor: 0–8) +
  (Symptom Severity × 5) +
  (Waiting Time Weight: 0–20)
```

- Emergencies always get priority (score jumps by 100)
- Infants, children, and elderly patients get age bonuses
- Symptoms are keyword-matched against severity map
- Waiting time increases score every 10 minutes (max 20 pts)

---

## 🤖 ML Models

### 1. Wait Time Predictor (Random Forest Regressor)
**Features:** queue length, avg consultation time, hour of day, emergency count, day of week  
**Metric:** MAE ~3-5 minutes, R² > 0.95

### 2. No-Show Predictor (Logistic Regression)
**Features:** age, distance, appointment hour, days since registration, previous no-shows, insurance type  
**Metric:** AUC-ROC > 0.80

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- Python ≥ 3.10
- PostgreSQL (or Supabase account)

### 1. Clone & Setup

```bash
git clone https://github.com/yourusername/hospital-queue-system
cd hospital-queue-system
```

### 2. Database Setup (Supabase)

1. Create project at [supabase.com](https://supabase.com)
2. Go to SQL Editor → Run `backend/migrations/001_initial_schema.sql`
3. Copy your connection string from Settings → Database

### 3. Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in your values in .env
npm install
npm run dev
```

### 4. ML Service Setup

```bash
cd ml-service
pip install -r requirements.txt
python scripts/train.py       # Train models (run once)
uvicorn main:app --reload     # Start ML API
```

### 5. Frontend Setup

```bash
cd frontend
cp .env.example .env
# Set REACT_APP_API_URL=http://localhost:5000
npm install
npm start
```

---

## 🌐 Deployment Guide

### Step 1: Database → Supabase
1. Create new project at supabase.com
2. Run SQL from `backend/migrations/001_initial_schema.sql`
3. Save your `DATABASE_URL` from project settings

### Step 2: ML Service → Render
1. Push code to GitHub
2. New Web Service → connect repo → rootDir: `ml-service`
3. Build: `pip install -r requirements.txt && python scripts/train.py`
4. Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Save your ML Service URL

### Step 3: Backend → Render
1. New Web Service → rootDir: `backend`
2. Add env vars (see `.env.example`)
3. Set `ML_SERVICE_URL` to your ML service URL
4. Save your Backend URL

### Step 4: Frontend → Vercel
1. Import GitHub repo at vercel.com
2. Root directory: `frontend`
3. Add env vars:
   - `REACT_APP_API_URL=https://your-backend.onrender.com/api`
   - `REACT_APP_SOCKET_URL=https://your-backend.onrender.com`

---

## 📊 API Documentation

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/login` | Public | Login admin/doctor |
| POST | `/api/auth/register-admin` | Public | Register hospital |
| GET | `/api/auth/me` | Auth | Get current user |

### Queue
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/queue/register` | Public | Register patient + get token |
| GET | `/api/queue/status/:id` | Public | Track queue status |
| GET | `/api/queue/doctor/:id` | Auth | Get doctor's queue |
| PATCH | `/api/queue/:id/call` | Doctor/Admin | Call patient |
| PATCH | `/api/queue/:id/complete` | Doctor/Admin | Complete consultation |

### Doctors
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/doctors` | Public | List doctors |
| POST | `/api/doctors` | Admin | Add doctor |
| PATCH | `/api/doctors/:id/availability` | Doctor/Admin | Toggle availability |

### Analytics
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/analytics/dashboard` | Admin | Full dashboard data |
| GET | `/api/analytics/peak-hours` | Admin | Peak hour heatmap |

### ML Service
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/predict/wait-time` | Predict wait minutes |
| POST | `/predict/no-show` | Predict no-show probability |
| GET | `/health` | Model health check |

---

## 🔐 Security Features

- JWT authentication with role-based access (admin/doctor)
- bcrypt password hashing (12 rounds)
- Rate limiting (100 req/15min general, 10 req/15min auth)
- Helmet.js security headers
- CORS whitelisting
- Input validation (express-validator)
- Environment variable isolation
- SQL parameterization (no raw queries)

---

## 📁 Folder Structure

```
hospital-queue-system/
├── backend/
│   ├── src/
│   │   ├── config/database.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── queueController.js
│   │   │   ├── doctorController.js
│   │   │   └── analyticsController.js
│   │   ├── services/
│   │   │   ├── priorityService.js
│   │   │   ├── tokenService.js
│   │   │   └── mlService.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── errorHandler.js
│   │   ├── routes/index.js
│   │   ├── socket.js
│   │   └── server.js
│   └── migrations/
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── PatientRegistration.jsx
│       │   ├── QueueTracker.jsx
│       │   ├── AdminDashboard.jsx
│       │   ├── DoctorQueue.jsx
│       │   └── Login.jsx
│       ├── services/
│       │   ├── api.js
│       │   └── socket.js
│       ├── context/authStore.js
│       └── App.jsx
├── ml-service/
│   ├── main.py
│   ├── models/           (generated after training)
│   ├── scripts/train.py
│   └── requirements.txt
├── render.yaml
└── README.md
```

---

## 📈 Future Scope

- **SMS/WhatsApp notifications** when patient's turn approaches
- **Mobile app** (React Native) for patients
- **Multi-hospital** SaaS with tenant isolation
- **Computer vision** for crowd density monitoring
- **NLP** for symptom severity extraction
- **Appointment scheduling** with calendar integration
- **Doctor recommendation** engine based on symptoms
- **Predictive staffing** based on historical patterns

---

## 💰 Monetization Strategy

| Tier | Price | Features |
|------|-------|----------|
| Starter | ₹5,000/mo | 1 hospital, 5 doctors, 500 patients/day |
| Professional | ₹15,000/mo | 3 hospitals, 25 doctors, unlimited patients |
| Enterprise | Custom | Multi-hospital, white-label, SLA, API access |

**Additional Revenue:**
- SMS notification add-on
- Analytics reports export
- Custom ML model training per hospital
- API access for third-party integrations

---

## 🤝 Contributing

PRs welcome! Please follow the existing code style and add tests for new features.

---

## 📝 License

MIT License - see LICENSE file for details

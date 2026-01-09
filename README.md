# OrgaOS

A simple project management app with Kanban boards, real-time collaboration, and personal productivity tools.

## Prerequisites

- Node.js (v20+)
- MongoDB running locally (`mongod`) or a MongoDB Atlas URI

## Setup

> **Note:** You need 2 terminals: one for backend, one for frontend.

### 1. Backend

```bash
# Install dependencies
npm install

# Create a .env file with:
MONGO_URI=mongodb://localhost:27017/orgaos
JWT_SECRET=your_secret_key

# Run the server
npm run dev
```

Backend runs on `http://localhost:3000`

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run the dev server
npm run dev
```

Frontend runs on `http://localhost:5173`

## Features

- User authentication (register/login)
- Project management with Kanban boards
- Real-time collaboration (Socket.IO)
- Personal space with calendar, Pomodoro timer, and private to-do list

## Project Structure

```
OrgaOS/
├── src/                    # Backend (Node.js + Express + Socket.IO)
│   ├── controllers/        # Business logic
│   ├── models/             # MongoDB schemas
│   ├── routes/             # REST API endpoints
│   └── middleware/         # Auth + Logging (Pino)
│
├── frontend/src/           # Frontend (React 19 + Vite + TailwindCSS)
│   ├── pages/              # Landing, Dashboard, ProjectBoard, PersonalSpace
│   ├── components/         # Calendar, Pomodoro, Todos, MembersModal
│   └── context/            # Socket.IO provider
│
├── tests/                  # 66 tests (Vitest + Supertest)
└── .github/workflows/      # CI/CD (GitHub Actions)
```

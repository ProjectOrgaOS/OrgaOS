# OrgaOS

A simple project management app with Kanban boards, real-time collaboration, and personal productivity tools.

## Prerequisites

- Node.js (v18+)
- MongoDB running locally or a MongoDB Atlas URI

## Setup

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

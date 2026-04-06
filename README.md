# Nightmare Esports - Full Stack Development Setup

A modern, full-stack esports organization platform built with **React 19** (frontend) and **Express + TypeScript** (backend). Official web presence and admin dashboard for Nightmare Esports - a professional esports organization based in Bangladesh.

## 📋 Overview

**Nightmare Esports** operates in Bangladesh, focusing on PUBG Mobile with expansion planned into multiple game titles. The platform specializes in tournament operations, team management, talent development, and community engagement.

### Key Features

**Frontend:**
- Responsive landing page with hero section and animations
- Tournament/events management interface
- Team showcase and achievements gallery
- Content creator spotlight
- Mobile-optimized navigation

**Backend:**
- RESTful API for events, teams, players, and achievements
- Real-time communication via Socket.IO
- JWT authentication for admin/event access
- PostgreSQL database for persistent data
- Redis caching for performance
- Structured logging with Winston

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 8.0.0, Tailwind CSS 4.2.1, React Router 7.13.1, Framer Motion 12.38.0, Lucide Icons |
| **Backend** | Express 5.1.0, TypeScript 5.9.2, Socket.IO 4.8.3, JWT Auth, bcrypt |
| **Database** | PostgreSQL 16 (Docker) |
| **Cache** | Redis 7 (Docker) |
| **Language** | JavaScript/JSX (Frontend), TypeScript (Backend) |

## 🚀 Quick Start (5 minutes)

### Prerequisites

- **Node.js** LTS (v18+ recommended) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Docker & Docker Compose** - [Download](https://www.docker.com/products/docker-desktop)
- **Git**

### 1. Clone and Install Dependencies

```bash
# Clone repository
git clone <repository-url>
cd esports

# Install root dependencies
npm install

# Install backend dependencies
npm install --prefix backend
```

### 2. Start Database Services (PostgreSQL + Redis)

```bash
# From workspace root
docker-compose up -d

# Verify services are running
docker-compose ps
```

Expected output:
```
CONTAINER ID  STATUS                    NAMES
...           Up (healthy)              esports-postgres
...           Up (healthy)              esports-redis
```

### 3. Setup Backend Environment

```bash
# Navigate to backend
cd backend

# Create .env file from example
cp .env.example .env

# Review and adjust .env if needed (defaults usually work)
cat .env
```

### 4. Initialize Database Schema

```bash
# From backend directory, run migrations/seed
psql -U postgres -h localhost -d esports -f schema/schema.sql
psql -U postgres -h localhost -d esports -f schema/seed.sql
```

### 5. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server runs at http://localhost:4000
```

**Terminal 2 - Frontend:**
```bash
npm run dev
# App runs at http://localhost:5173
```

✅ **Done!** Open http://localhost:5173 in your browser.

---

## 📁 Project Structure

```
esports/ (monorepo root)
├── frontend code
│   ├── src/
│   │   ├── pages/             # Page-level components
│   │   ├── components/        # Reusable UI components
│   │   ├── services/          # API clients & utilities
│   │   ├── data/              # Constants & mock data
│   │   └── hooks/             # Custom React hooks
│   ├── public/                # Static assets
│   ├── info/                  # Content markdown
│   └── package.json           # Frontend dependencies
│
├── backend/
│   ├── src/
│   │   ├── server.ts          # Express app entry point
│   │   ├── config/            # Environment configuration
│   │   ├── routes/            # API endpoints
│   │   ├── controllers/       # Request handlers
│   │   ├── services/          # Business logic (db, cache, logging)
│   │   ├── middleware/        # Express middleware
│   │   ├── sockets/           # Socket.IO handlers
│   │   ├── types/             # TypeScript type definitions
│   │   └── utils/             # Helper utilities
│   ├── schema/
│   │   ├── schema.sql         # PostgreSQL DDL
│   │   └── seed.sql           # Sample data
│   ├── dist/                  # Compiled JavaScript (build output)
│   └── package.json           # Backend dependencies
│
├── docs/                      # Documentation
├── docker-compose.yml         # Services configuration
├── package.json               # Root scripts
└── README.md                  # This file
```

---

## 🔧 Development Commands

### Frontend (from root directory)

```bash
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend (from root directory)

```bash
npm run backend:dev      # Start backend dev server with hot reload
npm run backend:build    # Build TypeScript to JavaScript
npm run backend:start    # Run production build
```

### Backend (from `backend/` directory)

```bash
npm run dev          # Start dev server (nodemon + tsx)
npm run build        # Compile TypeScript
npm run start        # Run compiled output
```

### Docker

```bash
# Start services in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes (cleanup)
docker-compose down -v
```

---

## 🔐 Environment Configuration

### Backend `.env` File

Create `backend/.env`:

```env
# Server
PORT=4000
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:5173

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=esports
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Redis
REDIS_URL=redis://localhost:6379

# JWT (optional, for auth)
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=24h
```

**Default values work with Docker setup.** Only change if you're using different database credentials.

---

## 🐘 Database Setup

### Using Docker (Recommended)

```bash
# Start PostgreSQL + Redis
docker-compose up -d

# Load schema and seed data
cd backend
psql -U postgres -h localhost -d esports -f schema/schema.sql
psql -U postgres -h localhost -d esports -f schema/seed.sql
```

### Using Local PostgreSQL

```bash
# Install PostgreSQL locally, then:
createdb esports
psql -U postgres -d esports -f backend/schema/schema.sql
psql -U postgres -d esports -f backend/schema/seed.sql

# Update .env with local connection details
```

### Reset Database

```bash
# Drop and recreate
dropdb -U postgres esports
createdb -U postgres esports

# Reload schema and seed
psql -U postgres -d esports -f backend/schema/schema.sql
psql -U postgres -d esports -f backend/schema/seed.sql
```

---

## 📡 API & WebSocket Endpoints

### Health Checks

```bash
curl http://localhost:4000/health     # Full health check
curl http://localhost:4000/ping       # Simple ping
```

### Socket.IO Client Usage

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:4000', {
  transports: ['websocket', 'polling']
});

// Emit events
socket.emit('ping');
socket.emit('chat', 'Hello World');

// Listen for events
socket.on('welcome', (data) => console.log(data));
socket.on('pong', (data) => console.log(data));
socket.on('system', (data) => console.log(data));
socket.on('chat', (data) => console.log(data));
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port 4000 or 5173
lsof -i :4000          # macOS/Linux
netstat -ano | findstr :4000  # Windows

# Kill process
kill -9 <PID>          # macOS/Linux
taskkill /PID <PID> /F # Windows
```

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check connection
psql -U postgres -h localhost -d esports

# View Docker logs
docker logs esports-postgres
```

### Redis Connection Error

```bash
# Check Redis status
docker logs esports-redis

# Test Redis
redis-cli -h localhost ping
```

### Frontend Can't Reach Backend API

1. Verify backend is running: `curl http://localhost:4000/ping`
2. Check `FRONTEND_ORIGIN` in backend `.env` matches frontend URL
3. Check browser console for CORS errors
4. Verify Socket.IO connection: Open DevTools → Network tab → filter by WS

### Module Not Found Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules backend/node_modules
npm install
npm install --prefix backend

# Clear build caches
rm -rf dist backend/dist

# Restart dev servers
```

---

## 📚 Additional Documentation

- [AGENTS.md](./AGENTS.md) - Frontend coding guidelines and conventions
- [BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md) - Backend API integration guide
- [LOGIN_GUIDE.md](./LOGIN_GUIDE.md) - Authentication flow documentation
- [backend/README.md](./backend/README.md) - Backend-specific details

---

## 🔄 Deployment

### Production Build

```bash
# Frontend
npm run build
# Output: dist/

# Backend
cd backend
npm run build
# Output: backend/dist/
```

### Running Production Build Locally

```bash
# Backend (requires .env setup)
cd backend
npm start

# Frontend (in new terminal)
npm run preview
```

---

## 💡 Tips & Best Practices

1. **Keep dev servers running** - Use separate terminal tabs/windows
2. **Monitor logs** - Watch backend console for errors and middleware execution
3. **Git workflow** - Commit frequently and use descriptive messages
4. **Database migrations** - Always backup before major schema changes
5. **Environment variables** - Never commit `.env` file (already in .gitignore)
6. **Frontend testing** - Test in multiple browsers and screen sizes
7. **Backend testing** - Use `curl` or Postman to test API endpoints

---

## 🤝 Contributing

Before starting development:
1. Read [AGENTS.md](./AGENTS.md) for code conventions
2. Ensure both dev servers start cleanly
3. Test API connectivity
4. Follow existing code patterns

---

## 📞 Support

For setup issues:
1. Check [Troubleshooting](#-troubleshooting) section
2. Verify Docker services: `docker-compose ps`
3. Check error logs in terminal and browser console
4. Review [BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md) for API details

---

**Happy coding! 🚀**

The development server runs at `http://localhost:5173` by default.

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Linting

```bash
npm run lint
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | LandingPage | Main landing page with all sections |
| `/teams` | TeamsPage | Organization teams and lineups |
| `/achievements` | AchievementsPage | Tournament achievements gallery |
| `/events` | EventsPage | Upcoming and past events |
| `/about` | AboutPage | Organization information |

## Key Data

### Navigation Links

- HOME (`/`)
- ABOUT (`/about`)
- TEAMS (`/teams`)
- ACHIEVEMENTS (`/achievements`)
- EVENTS (`/events`)

### Tournament Data

- **Event:** NMxERD T1 Elite League Season 3
- **Slots:** 36
- **Registrations:** 50 teams
- **Registration Date:** June 2nd
- **Average Lobby:** 64-74 players
- **Partners:** Krafton, Tencent Games, Lightspeed & Quantum, United Nations Community

### Achievements (NMxERD T1 Elite League - June 17, 2025)

| Rank | Team | Placement |
|------|------|-----------|
| 1st Runners Up | Quadratic Esports | 2nd Place |
| 2nd Runners Up | Before the Storm | 3rd Place |
| 3rd Runners Up | RIP Esports | 4th Place |
| 4th Runners Up | Badrage Esports | 5th Place |

### Teams

| Team Name | Line-up | Status | Game |
|-----------|---------|--------|------|
| Nightmare Esports | 1st Line-up | Active | PUBG Mobile |
| Nightmare Official | 2nd Line-up | Active | PUBG Mobile |

### Organization Info

- **Location:** Bangladesh
- **Focus:** PUBG Mobile
- **Services:** Tournament Operations, Team Management, Talent Development
- **Expansion:** Multiple game titles planned

## Design System

### Color Palette

| Name | Value | Usage |
|------|-------|-------|
| Primary | `#ff0000` | Accent color, CTAs, highlights |
| Background | `#000000` | Main background |
| Secondary | `#ffffff` | Text, borders |

### Typography

- **Display Font:** Orbitron (headings, titles)
- **Body Font:** Inter (body text)
- **Brutal Font:** Space Grotesk (special elements)

### Custom CSS Classes

- `.skew-btn` - Skewed button with primary color
- `.glass` - Glass morphism effect
- `.glass-dark` - Dark glass effect
- `.brutal-border` - Brutalist border style
- `.cyber-card` - Cyberpunk-style card
- `.text-glow` - Red text glow effect
- `.gradient-text` - Animated gradient text

### Animations

- `glitch` - Glitch text effect
- `float` - Floating animation
- `pulse-glow` - Pulsing glow effect
- `scan` - Scan line animation
- `marquee` - Continuous scrolling text

## Content Files

Content is stored in markdown format in the `info/` directory:

- [`info/about.md`](info/about.md) - Organization description
- [`info/team.md`](info/team.md) - Team information
- [`info/event.md`](info/event.md) - Event details
- [`info/achivement.md`](info/achivement.md) - Achievement records

## Development Notes

### Import Conventions

All imports follow a specific order:
1. React core imports
2. Third-party library imports
3. Local CSS imports
4. Local component imports (with `.jsx` extension)

Example:
```javascript
import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Calendar, ChevronRight } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import './index.css';
import App from './App.jsx';
```

### Component Patterns

Components are defined as functional components with named exports:
```javascript
const ComponentName = () => {
  return (
    // JSX
  );
};

export default ComponentName;
```

### State Management

- **Local State:** Use `useState` for component-local state
- **No Global State:** No Redux, Zustand, or Context currently configured
- **Router State:** Managed by React Router DOM

### Responsive Breakpoints

Tailwind CSS breakpoints are used throughout:
- Mobile: Default
- Tablet: `md:`
- Desktop: `lg:`
- Large Desktop: `xlg:`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Follow the existing code style and conventions
- Use 2-space indentation
- Include `.jsx` extensions in imports
- Follow component patterns defined in AGENTS.md

2. Test changes locally before committing
3. Run linting: `npm run lint`

## License

Private - All rights reserved by Nightmare Esports

## Contact

For inquiries about sponsorships and partnerships, contact through the official social media channels listed on the website.

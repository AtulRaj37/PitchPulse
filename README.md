# PitchPulse 🏏

> Hyper-local cricket scoring and tournament management platform built with Event Sourcing + CQRS architecture.

![PitchPulse Banner](public/banner.png)

## 🚀 Features

### Core Features
- **Ball-by-Ball Scoring** - Real-time cricket scoring with instant updates
- **Tournament Management** - Create tournaments, auto-generate fixtures, points tables
- **Live Spectator Mode** - Real-time score updates via WebSocket
- **Event Sourcing** - Immutable event log with snapshot optimization
- **Offline Scoring** - Score matches offline with sync on reconnect

### Architecture Highlights
- **Event Store** - Immutable events with sequenceNumber for strict ordering
- **Snapshotting** - State snapshots every 20 events for fast replay
- **Idempotency** - Client-generated UUIDs prevent duplicate events
- **Projections** - Idempotent read models with retry handling
- **Pub/Sub** - Redis pub/sub for horizontal scaling
- **Rate Limiting** - Stricter limits for scoring endpoints

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
│              Next.js (App Router) + React Query                     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                     BACKEND LAYER                                   │
│              Fastify + Socket.IO + Prisma                           │
│                                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │   Auth   │ │  Match   │ │ Command  │ │Tournament│              │
│  └──────────┘ └──────────┘ │  Layer   │ └──────────┘              │
│                            └─────┬─────┘                            │
│                                  │                                  │
│  ┌──────────────────────────────▼───────────────────────────────┐  │
│  │           EVENT VALIDATION LAYER                             │  │
│  │  Cricket Rules: Status, Balls/Over, Wickets, Players         │  │
│  └──────────────────────────────┬───────────────────────────────┘  │
│                                  │                                  │
│  ┌──────────────────────────────▼───────────────────────────────┐  │
│  │           MATCH STATE BUILDER                                 │  │
│  │  buildMatchState(): Score, Wickets, Overs, Run Rate           │  │
│  └──────────────────────────────┬───────────────────────────────┘  │
│                                  │                                  │
│  ┌──────────────────────────────▼───────────────────────────────┐  │
│  │              EVENT SOURCING LAYER                             │  │
│  │  Event Store → Snapshots → Async Broadcast → Redis/WebSocket  │  │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
              ┌────────────────┴────────────────┐
              │                                 │
       PostgreSQL                            Redis
       (Primary DB)                      (Pub/Sub + Cache)
```

## 🛠️ Tech Stack

### Backend
- **Framework**: Fastify 4.x
- **Language**: TypeScript 5.x
- **ORM**: Prisma 5.x
- **Database**: PostgreSQL 16+
- **Cache**: Redis 7+
- **Real-time**: Socket.IO 4.x
- **Auth**: JWT with @fastify/jwt
- **Validation**: Zod
- **Logging**: Pino with pino-pretty

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Animations**: Framer Motion, GSAP, Lenis
- **State**: Zustand, TanStack Query
- **Charts**: D3.js
- **Real-time**: Socket.IO Client

## 📦 Project Structure

```
pitchpulse/
├── packages/
│   └── shared/           # Shared types and utilities (ESM)
├── backend/
│   ├── src/
│   │   ├── modules/     # Feature modules (auth, match, etc.)
│   │   │   ├── auth/    # JWT authentication
│   │   │   └── match/   # Match CRUD
│   │   ├── core/        # Core infrastructure
│   │   │   ├── db/      # Prisma client
│   │   │   ├── redis/   # Redis + Pub/Sub
│   │   │   ├── websocket/  # Socket.IO server
│   │   │   ├── middleware/ # Auth, error handling
│   │   │   └── validation/ # Zod schemas
│   │   ├── event-sourcing/
│   │   │   ├── event-store/  # Immutable event storage
│   │   │   └── projections/  # Read model projections
│   │   └── shared/utils/  # Logger, helpers
│   └── prisma/           # Database schema and migrations
├── frontend/
│   ├── app/              # Next.js pages
│   ├── components/       # Reusable UI components
│   ├── features/         # Feature-specific components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API and WebSocket services
│   └── store/           # Zustand stores
└── docker-compose.yml    # Docker setup
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Docker (optional)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/pitchpulse.git
cd pitchpulse
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

4. **Start services with Docker**
```bash
docker-compose up -d postgres redis
```

5. **Setup database**
```bash
npm run db:generate -w @pitchpulse/backend
npm run db:migrate -w @pitchpulse/backend
npm run db:seed -w @pitchpulse/backend
```

6. **Start development servers**
```bash
npm run dev
```

### Manual Setup (Without Docker)

1. Install PostgreSQL and Redis locally
2. Create database: `createdb pitchpulse`
3. Update `.env` with your database URL
4. Run `npm run db:migrate -w @pitchpulse/backend`
5. Run `npm run dev`

## 📚 Implemented Modules

### Phase 1: Foundation ✅
- Project architecture design
- Monorepo workspace setup
- Shared types package (ESM)
- TailwindCSS configuration
- Docker setup

### Phase 2: Backend Core ✅
- Fastify server with plugins
- Prisma client singleton
- Redis connection + Pub/Sub
- Socket.IO server with rooms
- Request ID tracking in logs
- Error handling middleware

### Phase 3: Database & Auth ✅
- PostgreSQL schema with Event Store
- **Event Store** with sequenceNumber and idempotency
- **Snapshot Store** for state snapshots every 20 events
- **Match Status**: CREATED, LIVE, COMPLETED, ABANDONED
- JWT authentication
- Rate limiting (stricter for scoring endpoints)
- Zod validation schemas
- Auth module (register, login, refresh, logout)
- Match module (CRUD)

### Phase 4: Command Layer & Scoring ✅
- **Command-based API** replacing direct event creation
- **Command Endpoints**:
  - `POST /api/commands/score-run` - Score 0-6 runs
  - `POST /api/commands/wicket` - Record wicket
  - `POST /api/commands/start-innings` - Start innings
  - `POST /api/commands/complete-innings` - Complete innings
  - `POST /api/commands/toss` - Record toss
  - `POST /api/commands/start-match` - Start match (LIVE)
  - `POST /api/commands/complete-match` - Complete match
  - `POST /api/commands/abandon-match` - Abandon match
  - `POST /api/commands/wide` - Record wide ball
  - `POST /api/commands/no-ball` - Record no-ball
  - `POST /api/commands/bye` - Record bye runs
  - `POST /api/commands/leg-bye` - Record leg-bye runs
  - `POST /api/commands/change-bowler` - Change bowler
- **Event Validation Layer** with cricket rules:
  - No scoring if match not LIVE
  - Max 6 balls per over validation
  - No events after match completion/abandonment
  - Striker/bowler validation
  - Wicket count validation (max 10)
  - Over count validation
- **Match State Builder** (`buildMatchState`):
  - Computes: score, wickets, overs, striker, bowler, run rate
  - Derives: batting order, bowling figures, extras
  - Pure function - same events always yield same state
- **Atomic Event Writes**:
  - Database transactions for event storage
  - sequenceNumber auto-increment in transaction
  - Client-generated UUIDs for idempotency
- **Async Event Flow**:
  - Event storage does not block broadcasting
  - Redis pub/sub publishing (non-blocking)
  - WebSocket broadcasting (fire-and-forget)
  - Stale rate limiting for scoring endpoints (10/min prod, 30/min dev)

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | Register user | No |
| POST | /api/auth/login | Login user | No |
| POST | /api/auth/refresh | Refresh token | No |
| POST | /api/auth/logout | Logout user | Yes |
| GET | /api/auth/me | Get current user | Yes |
| PATCH | /api/auth/profile | Update profile | Yes |
| POST | /api/auth/change-password | Change password | Yes |

### Matches
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/matches | Create match | Yes |
| GET | /api/matches | List matches | No |
| GET | /api/matches/:id | Get match | No |
| PATCH | /api/matches/:id | Update match | Yes |
| DELETE | /api/matches/:id | Delete match | Yes |

### Commands (Scoring)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/commands/score-run | Score runs | Yes |
| POST | /api/commands/wicket | Record wicket | Yes |
| POST | /api/commands/wide | Record wide | Yes |
| POST | /api/commands/no-ball | Record no-ball | Yes |
| POST | /api/commands/bye | Record bye | Yes |
| POST | /api/commands/leg-bye | Record leg-bye | Yes |
| POST | /api/commands/start-innings | Start innings | Yes |
| POST | /api/commands/complete-innings | Complete innings | Yes |
| POST | /api/commands/toss | Record toss | Yes |
| POST | /api/commands/start-match | Start match | Yes |
| POST | /api/commands/complete-match | Complete match | Yes |
| POST | /api/commands/abandon-match | Abandon match | Yes |
| POST | /api/commands/change-bowler | Change bowler | Yes |

### Health Checks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Basic health check |
| GET | /ready | Readiness with DB/Redis |
| GET | /rate-limit-status | Rate limit config |

## 📊 Event Sourcing Design

### Event Store
```prisma
model Event {
  id            String    @id // Client-generated UUID (idempotency)
  matchId       String
  eventType     EventType
  sequenceNumber Int      // Strict ordering per match
  payload       Json     // Event-specific data
  version       Int      @default(1) // Optimistic locking
  createdBy     String   // User ID
  source        String   @default("api") // web, mobile, api
  ipAddress     String?  // Client IP
  timestamp     DateTime @default(now())
}
```

### Snapshot Store
```prisma
model Snapshot {
  id              String   @id @default(uuid())
  matchId         String
  sequenceNumber  Int      // Last event in snapshot
  state           Json     // Serialized match state
  eventCount      Int      // Events since last snapshot
  createdAt       DateTime @default(now())
}
```

### Projection Safety
- **Idempotent**: Uses upsert operations
- **Retry-safe**: Exponential backoff with 3 retries
- **Rebuildable**: Can replay from snapshot

### Command Layer (Phase 4)
- **Command-based API**: Replace direct event creation with validated commands
- **Commands**: score-run, wicket, wide, no-ball, start-innings, complete-innings, toss, etc.
- **Event Generation**: Commands generate one or more events atomically
- **Validation**: Cricket rules enforced before event generation
- **Match State Builder**: Pure function computing score, wickets, overs, run rate

### Async Event Flow
- Event creation returns immediately after storage
- Redis pub/sub publishing is non-blocking
- WebSocket broadcasting is fire-and-forget
- Projection updates happen asynchronously

## 🐳 Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild
docker-compose up -d --build
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run backend tests
npm test -w @pitchpulse/backend

# Run frontend tests
npm test -w @pitchpulse/frontend
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ for cricket lovers 🏏

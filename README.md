# AssetOps — IT Asset Management System

Full-stack enterprise application for managing IT asset lifecycle.
**Java 21 + Spring Boot 3** · **Angular 18** · **Render** · **Vercel** · **Upstash Redis** · **Docker**

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ┌──────────────┐      ┌──────────────────────────────────┐    │
│   │   Angular    │─────▶│       Spring Boot API            │    │
│   │  (Vercel)    │      │    /api/* + WebSocket /ws        │    │
│   └──────────────┘      └──────┬───────────────┬───────────┘    │
│                                │               │                │
│                         ┌──────▼──┐     ┌──────▼──┐             │
│                         │ Postgres│     │ Upstash │             │
│                         │    DB   │     │ (Redis) │             │
│                         │ (Render)│     │         │             │
│                         └─────────┘     └─────────┘             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Angular 18 + SCSS | SPA, reactive state, WebSocket client |
| Backend | Java 21 + Spring Boot 3.3 | REST API, business logic, security |
| Database | PostgreSQL 16 | Persistent data, Flyway migrations |
| Cache | Redis (Upstash) | Session, API response cache, rate limiting |
| Auth | Spring Security + JWT | RBAC: EMPLOYEE / IT_ADMIN / SUPER_ADMIN |
| Real-time | WebSocket (STOMP) | Push notifications to browser |
| Container | Docker | Image build and storage |
| Deploy | Render (Backend) + Vercel (Frontend) | Cloud deployment, auto-scaling |
| CI/CD | GitHub Actions | Test → Build → Deploy |
| Monitoring | Prometheus + Grafana | Metrics, dashboards |

---

## Project Structure

```
assetops/
├── backend/                    # Spring Boot application
│   ├── src/main/java/com/assetops/
│   │   ├── controller/         # REST controllers (Asset, Request, Auth, Dashboard)
│   │   ├── service/            # Business logic interfaces
│   │   │   └── impl/           # Service implementations
│   │   ├── entity/             # JPA entities (Asset, User, AssetRequest, AuditLog)
│   │   ├── repository/         # Spring Data JPA repositories
│   │   ├── dto/
│   │   │   ├── request/        # Incoming request records
│   │   │   └── response/       # Outgoing response records
│   │   ├── enums/              # AssetStatus, Role, Priority, etc.
│   │   ├── security/           # JWT service, filter, UserDetailsService
│   │   ├── config/             # Security, Redis, WebSocket config
│   │   └── exception/          # Global handler, custom exceptions
│   ├── src/main/resources/
│   │   ├── application.yml     # All config (DB, Redis, JWT)
│   │   └── db/migration/       # Flyway SQL migrations
│   └── Dockerfile
│
├── frontend/                   # Angular 18 application
│   ├── src/app/
│   │   ├── core/
│   │   │   ├── services/       # ApiService, AuthService, WebSocketService
│   │   │   ├── guards/         # authGuard, adminGuard, roleGuard
│   │   │   └── interceptors/   # JWT + error interceptor
│   │   ├── features/
│   │   │   ├── auth/           # Login, register components
│   │   │   ├── dashboard/      # KPI cards, charts, activity feed
│   │   │   ├── inventory/      # Asset CRUD, filters, bulk actions
│   │   │   ├── requests/       # Submit, approve/reject workflow
│   │   │   ├── lifecycle/      # EOL tracking, refresh scheduler
│   │   │   ├── users/          # User management, RBAC
│   │   │   └── reports/        # Analytics, export PDF/CSV
│   │   ├── shared/
│   │   │   ├── components/     # Layout, chip, table, modal, skeleton
│   │   │   └── models/         # TypeScript interfaces for all entities
│   │   ├── app.routes.ts       # Lazy-loaded route config
│   │   └── app.config.ts       # Providers: HTTP, router, animations
│   ├── src/styles.scss         # Global theme: dark/light, chips, panels
│   ├── nginx.conf              # SPA routing + security headers
│   └── Dockerfile
│
├── infra/                      # Infrastructure as code (Terraform/Prometheus)
├── docker-compose.yml          # Full local stack
└── .github/workflows/ci-cd.yml # GitHub Actions pipeline
```

---

## Quick Start (Local Dev)

### Prerequisites
- Docker Desktop
- Java 21 (for running backend without Docker)
- Node.js 20 (for Angular dev server)

### 1. Clone and start all services
```bash
git clone https://github.com/your-org/assetops.git
cd assetops

# Start all infrastructure + app services
docker-compose up -d

# Watch logs
docker-compose logs -f backend
```

### 2. Services available locally
| Service | URL |
|---------|-----|
| Frontend (Angular) | http://localhost:4200 |
| Backend API | http://localhost:8080/api |
| Swagger UI | http://localhost:8080/api/swagger-ui.html |
| Grafana | http://localhost:3000 |
| Prometheus | http://localhost:9090 |

### 3. Default credentials
| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@assetops.com | Admin@123 |
| IT Admin | arjun@assetops.com | Admin@123 |

### 4. Run backend in dev mode (hot reload)
```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

### 5. Run frontend in dev mode
```bash
cd frontend
npm install
npm start
# Opens http://localhost:4200 with proxy to backend
```

---

## Key Features

### Role-Based Access Control (RBAC)
| Feature | EMPLOYEE | IT_ADMIN | SUPER_ADMIN |
|---------|----------|----------|-------------|
| View assets | ✅ | ✅ | ✅ |
| Create/edit assets | ❌ | ✅ | ✅ |
| Submit requests | ✅ | ✅ | ✅ |
| Approve/reject requests | ❌ | ✅ | ✅ |
| Allocate assets | ❌ | ✅ | ✅ |
| View reports | ❌ | ✅ | ✅ |
| Manage users | ❌ | ✅ | ✅ |
| System admin | ❌ | ❌ | ✅ |

### Request Workflow (State Machine)
```text
PENDING → APPROVED → ALLOCATED → RETURNED
        ↘ REJECTED
```

### Redis Caching Strategy
| Cache | TTL | Contents |
|-------|-----|---------|
| `assets` | 10 min | Individual asset responses |
| `asset-stats` | 5 min | Category/status aggregations |
| `dashboard-stats` | 3 min | KPI numbers |
| `users` | 30 min | User profiles |
| `reports` | 1 hour | Pre-computed report data |

---

## Deployment Configuration

This project is deployed across multiple cloud platforms for a cost-effective, scalable architecture.

1. **Backend (Render):** Deployed as a Dockerized Web Service. Handles API requests, WebSockets, and Postgres connection.
2. **Database (Render PostgreSQL):** Managed database service connected via private network to the backend.
3. **Frontend (Vercel):** Angular SPA statically built and deployed to Vercel's global CDN.
4. **Cache (Upstash Redis):** Serverless Redis instance for high-speed dashboard telemetry caching.

---

## API Reference

Full interactive API docs at `/api/swagger-ui.html`

### Core endpoints
```text
POST   /api/auth/login              Login
POST   /api/auth/register           Register
GET    /api/auth/me                 Current user

GET    /api/assets                  List/search assets
POST   /api/assets                  Create asset       [ADMIN]
PUT    /api/assets/{id}             Update asset       [ADMIN]
POST   /api/assets/{id}/assign/{uid} Assign to user   [ADMIN]
POST   /api/assets/{id}/return      Return asset       [ADMIN]
GET    /api/assets/eol              Near EOL assets    [ADMIN]

GET    /api/requests                List requests
POST   /api/requests                Submit request
POST   /api/requests/{id}/approve   Approve            [ADMIN]
POST   /api/requests/{id}/reject    Reject             [ADMIN]
POST   /api/requests/{id}/allocate  Allocate asset     [ADMIN]

GET    /api/dashboard/stats         KPI summary        [ADMIN]
GET    /api/users                   List users         [ADMIN]
GET    /api/notifications           My notifications
POST   /api/notifications/mark-all-read  Mark read
```

---

## Environment Variables

### Backend (`application.yml` or `.env`)
| Variable | Description | Example |
|----------|-------------|---------|
| `SPRING_DB_URL` | PostgreSQL JDBC URL | `jdbc:postgresql://...` |
| `DB_USER` | Database username | `assetops` |
| `DB_PASSWORD` | Database password | secret |
| `SPRING_REDIS_URL` | Upstash Redis connection string | `redis://default:password@...` |
| `JWT_SECRET` | 256-bit JWT signing key | 64-char string |
| `CORS_ORIGINS` | Allowed frontend origin | `https://assetops-frontend.vercel.app` |

---

## Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/my-feature`
3. Write tests for new logic
4. Submit PR against `develop`

---

## License
MIT

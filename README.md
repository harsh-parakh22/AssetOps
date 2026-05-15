# AssetOps — IT Asset Management System

Full-stack enterprise application for managing IT asset lifecycle.
**Java 21 + Spring Boot 3** · **Angular 18** · **GCP Cloud Run** · **Redis** · **Kafka** · **Docker**

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        GCP Cloud Run                            │
│                                                                 │
│   ┌──────────────┐      ┌──────────────────────────────────┐   │
│   │   Angular    │─────▶│       Spring Boot API            │   │
│   │  (Frontend)  │      │    /api/* + WebSocket /ws        │   │
│   └──────────────┘      └──────┬───────────────┬───────────┘   │
│                                │               │               │
│                         ┌──────▼──┐     ┌──────▼──┐           │
│                         │ Cloud   │     │  Redis  │           │
│                         │  SQL    │     │ (Cache/ │           │
│                         │(Postgres│     │Session) │           │
│                         └─────────┘     └─────────┘           │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │               Kafka / Cloud Pub/Sub                     │  │
│   │  asset-events │ request-events │ notification-events   │  │
│   └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
   Cloud Monitoring     Cloud Logging         Secret Manager
   + Prometheus          (Audit trail)         (credentials)
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Angular 18 + SCSS | SPA, reactive state, WebSocket client |
| Backend | Java 21 + Spring Boot 3.3 | REST API, business logic, security |
| Database | PostgreSQL 16 (Cloud SQL) | Persistent data, Flyway migrations |
| Cache | Redis 7 (Memorystore) | Session, API response cache, rate limiting |
| Messaging | Apache Kafka / GCP Pub/Sub | Async events: notifications, audit, EOL alerts |
| Auth | Spring Security + JWT | RBAC: EMPLOYEE / IT_ADMIN / SUPER_ADMIN |
| Real-time | WebSocket (STOMP) | Push notifications to browser |
| Container | Docker + Artifact Registry | Image build and storage |
| Deploy | GCP Cloud Run | Serverless containers, auto-scaling |
| CI/CD | GitHub Actions | Test → Build → Push → Deploy |
| Monitoring | Prometheus + Grafana | Metrics, dashboards, alerting |

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
│   │   ├── kafka/              # Producer & consumer
│   │   ├── security/           # JWT service, filter, UserDetailsService
│   │   ├── config/             # Security, Redis, Kafka, WebSocket config
│   │   └── exception/          # Global handler, custom exceptions
│   ├── src/main/resources/
│   │   ├── application.yml     # All config (DB, Redis, Kafka, JWT, GCP)
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
├── infra/
│   ├── k8s/                    # Kubernetes manifests (optional)
│   └── terraform/              # GCP infrastructure as code
│
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
| Kafka UI | http://localhost:8090 |
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
```
PENDING → APPROVED → ALLOCATED → RETURNED
        ↘ REJECTED
```

### Kafka Topics
| Topic | Producer | Consumer | Purpose |
|-------|----------|----------|---------|
| `asset-events` | AssetService | Analytics | Asset CRUD, assignment changes |
| `request-events` | RequestService | Analytics | Approval workflow transitions |
| `notification-events` | All services | NotificationConsumer | Email + WebSocket push |
| `audit-events` | All services | AuditConsumer | Compliance audit trail |

### Redis Caching Strategy
| Cache | TTL | Contents |
|-------|-----|---------|
| `assets` | 10 min | Individual asset responses |
| `asset-stats` | 5 min | Category/status aggregations |
| `dashboard-stats` | 3 min | KPI numbers |
| `users` | 30 min | User profiles |
| `reports` | 1 hour | Pre-computed report data |

---

## GCP Deployment

### Prerequisites
```bash
# Install Google Cloud CLI
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Enable APIs
gcloud services enable \
  run.googleapis.com \
  cloudsql.googleapis.com \
  redis.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  pubsub.googleapis.com
```

### Create infrastructure
```bash
# Artifact Registry
gcloud artifacts repositories create assetops \
  --repository-format=docker \
  --location=asia-south1

# Cloud SQL (PostgreSQL)
gcloud sql instances create assetops-db \
  --database-version=POSTGRES_16 \
  --tier=db-g1-small \
  --region=asia-south1

# Redis (Memorystore)
gcloud redis instances create assetops-cache \
  --size=1 --region=asia-south1 --tier=basic

# Store secrets
echo -n "your-jwt-secret" | gcloud secrets create assetops-jwt-secret --data-file=-
```

### Deploy via GitHub Actions
Push to `main` branch — the CI/CD pipeline handles the rest:
1. Runs tests
2. Builds Docker images
3. Pushes to Artifact Registry
4. Deploys to Cloud Run

---

## API Reference

Full interactive API docs at `/api/swagger-ui.html`

### Core endpoints
```
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

### Backend
| Variable | Description | Example |
|----------|-------------|---------|
| `DB_URL` | PostgreSQL JDBC URL | `jdbc:postgresql://...` |
| `DB_USER` | Database username | `assetops` |
| `DB_PASSWORD` | Database password | secret |
| `REDIS_HOST` | Redis hostname | `10.0.0.3` |
| `REDIS_PASSWORD` | Redis auth | secret |
| `KAFKA_BOOTSTRAP_SERVERS` | Kafka brokers | `kafka:9092` |
| `JWT_SECRET` | 256-bit JWT signing key | 64-char string |
| `CORS_ORIGINS` | Allowed origins | `https://app.assetops.com` |

---

## Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/my-feature`
3. Write tests for new logic
4. Submit PR against `develop`

---

## License
MIT

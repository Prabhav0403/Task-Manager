# ⚡ PrimeTrade – Scalable REST API with Auth & RBAC

A production-ready backend API built with **Node.js + Express + MongoDB**, featuring JWT authentication, role-based access control, full CRUD for tasks, Swagger documentation, and a React frontend.

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/primetrade-api.git
cd primetrade-api/backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets
```

### 3. Run the Server

```bash
npm run dev      # Development (with hot reload)
npm start        # Production
```

### 4. Open the Frontend

Just open `frontend/index.html` in your browser. Make sure the backend is running on port 5000.

### 5. View API Docs

Navigate to: **http://localhost:5000/api-docs**

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── app.js                  # Express app setup
│   ├── server.js               # HTTP server entry point
│   ├── config/
│   │   ├── database.js         # MongoDB connection
│   │   └── swagger.js          # Swagger/OpenAPI config
│   ├── controllers/
│   │   ├── auth.controller.js  # Register, login, refresh, logout
│   │   ├── task.controller.js  # Full CRUD + stats
│   │   ├── user.controller.js  # Profile management
│   │   └── admin.controller.js # Admin user management
│   ├── middleware/
│   │   ├── auth.middleware.js  # JWT protect + restrictTo
│   │   ├── errorHandler.js     # Global error + 404 handlers
│   │   └── validate.middleware.js
│   ├── models/
│   │   ├── User.model.js       # User schema (bcrypt, JWT helpers)
│   │   └── Task.model.js       # Task schema (indexes, validation)
│   ├── routes/v1/
│   │   ├── auth.routes.js
│   │   ├── task.routes.js
│   │   ├── user.routes.js
│   │   └── admin.routes.js
│   ├── utils/
│   │   ├── jwt.utils.js        # Token generation & verification
│   │   ├── logger.js           # Winston logger
│   │   └── response.utils.js   # Standardized response helpers
│   └── validators/
│       ├── auth.validators.js
│       └── task.validators.js
├── tests/
│   └── auth.test.js
├── logs/                       # Auto-created log files
├── .env.example
├── jest.config.json
└── package.json

frontend/
└── index.html                  # Single-file React app
```

---

## 🔐 API Endpoints

### Authentication (`/api/v1/auth`)

| Method | Endpoint             | Auth     | Description                    |
|--------|----------------------|----------|--------------------------------|
| POST   | `/register`          | Public   | Register new user              |
| POST   | `/login`             | Public   | Login, returns JWT tokens      |
| POST   | `/refresh`           | Public   | Refresh access token           |
| POST   | `/logout`            | Required | Invalidate refresh token       |
| GET    | `/me`                | Required | Get current user               |
| PATCH  | `/change-password`   | Required | Change password                |

### Tasks (`/api/v1/tasks`)

| Method | Endpoint       | Auth     | Description                      |
|--------|----------------|----------|----------------------------------|
| GET    | `/`            | Required | List tasks (filters, pagination) |
| POST   | `/`            | Required | Create task                      |
| GET    | `/stats`       | Required | Task count by status/priority    |
| GET    | `/:id`         | Required | Get single task                  |
| PUT    | `/:id`         | Required | Update task                      |
| DELETE | `/:id`         | Required | Soft-delete (archive) task       |

### Admin (`/api/v1/admin`) – Admin role required

| Method | Endpoint         | Description                    |
|--------|------------------|--------------------------------|
| GET    | `/stats`         | Platform-wide statistics       |
| GET    | `/users`         | List all users (paginated)     |
| GET    | `/users/:id`     | Get user + task count          |
| PATCH  | `/users/:id`     | Update role or active status   |
| DELETE | `/users/:id`     | Delete user + cascade tasks    |

---

## 🛡️ Security Features

- **Password Hashing** – bcryptjs with 12 salt rounds
- **JWT Access + Refresh Tokens** – Short-lived access tokens (7d), long-lived refresh tokens (30d)
- **Token Rotation** – New refresh token issued on each refresh
- **Helmet** – Sets secure HTTP headers
- **Rate Limiting** – 100 req/15min globally; 20 req/15min on auth endpoints
- **Input Validation** – express-validator on all routes
- **Input Sanitization** – `trim()`, `normalizeEmail()`, length limits
- **Ownership Checks** – Users can only access their own tasks
- **Password Change Detection** – Invalidates tokens if password changed after issue
- **Soft Delete** – Tasks are archived, not permanently deleted

---

## 🧪 Running Tests

```bash
cd backend
npm test               # Run test suite
npm test -- --coverage # With coverage report
```

---

## 🗄️ Database Schema

### Users Collection
```
_id, name, email (unique), password (hashed), role (user|admin),
isActive, refreshToken, lastLogin, passwordChangedAt, createdAt, updatedAt
```

### Tasks Collection  
```
_id, title, description, status (todo|in-progress|done),
priority (low|medium|high), owner (→ User), dueDate, tags[],
isArchived, createdAt, updatedAt
```

**Indexes:**
- `users`: email (unique), role
- `tasks`: (owner, createdAt), (owner, status), (owner, priority), text index on title+description

---

## 📊 Scalability Design

See **[SCALABILITY.md](./SCALABILITY.md)** for full details.

**Key patterns used:**
- Modular architecture (controllers / routes / models separate)
- Pagination on all list endpoints
- MongoDB compound indexes for common query patterns
- Structured logging (Winston) for observability
- Environment-driven config for multi-environment deployment
- Graceful shutdown handling

**Next steps for scale:**
- Redis caching for hot endpoints
- Docker + Docker Compose
- Horizontal scaling behind a load balancer
- Microservices split (auth service, task service)

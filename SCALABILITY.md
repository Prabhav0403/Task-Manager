# 📈 Scalability & Architecture Notes

## Current Architecture

This API is designed as a **modular monolith** – structured to be split into microservices when traffic demands it.

```
Client → Nginx (reverse proxy) → Node.js App → MongoDB
```

---

## 1. Horizontal Scaling (Stateless Design)

The API is **stateless by design**:
- No server-side sessions – authentication is entirely JWT-based
- Refresh tokens stored in MongoDB, not in-memory
- Any number of Node.js instances can run in parallel behind a load balancer

```
                   ┌─────────────────────┐
Client ──→ Nginx ──│ Round-Robin LB      │
                   ├────────┬────────────┤
                   │ Node 1 │  Node 2    │  ← Stateless, auto-scalable
                   └────────┴────────────┘
                            │
                   ┌────────▼────────────┐
                   │   MongoDB Replica   │  ← Primary + 2 secondaries
                   │       Set           │
                   └─────────────────────┘
```

**Load balancer options:** Nginx, AWS ALB, or Cloudflare.

---

## 2. Caching with Redis

High-read endpoints (task stats, admin stats) can be cached:

```javascript
// Example: cache task stats for 60 seconds
const cached = await redis.get(`task_stats:${userId}`);
if (cached) return JSON.parse(cached);
const stats = await Task.aggregate([...]);
await redis.setEx(`task_stats:${userId}`, 60, JSON.stringify(stats));
```

**Cache invalidation:** On task create/update/delete, bust the relevant cache key.

**Redis also enables:**
- Rate limiting across multiple Node instances (replace in-memory limiter)
- Distributed session/token blacklist
- Job queues (Bull.js) for background tasks like email sending

---

## 3. Database Optimization

### Indexes in place:
- `users`: compound index on `email` (unique), `role`
- `tasks`: compound indexes on `(owner, createdAt)`, `(owner, status)`, `(owner, priority)`
- `tasks`: text index on `title + description` for full-text search

### For higher scale:
- **MongoDB Atlas** with auto-scaling compute
- **Read replicas** – route heavy analytics queries to secondary nodes
- **Time-based partitioning** – archive old tasks to separate collection
- **Connection pooling** – Mongoose pools connections by default (configurable via `maxPoolSize`)

---

## 4. Microservices Split (Future)

When the monolith needs to scale independently:

```
┌──────────────────┐   ┌───────────────────┐   ┌──────────────────┐
│   Auth Service   │   │   Task Service    │   │  Admin Service   │
│ /api/v1/auth     │   │ /api/v1/tasks     │   │ /api/v1/admin    │
│ MongoDB: users   │   │ MongoDB: tasks    │   │ Read-only views  │
└──────────────────┘   └───────────────────┘   └──────────────────┘
         │                      │                       │
         └──────────────────────▼───────────────────────┘
                     API Gateway (Kong / AWS API GW)
```

The current codebase already follows this structure – each service maps 1:1 to the existing controller/route/model files.

---

## 5. Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
EXPOSE 5000
CMD ["node", "src/server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: ./backend
    ports: ["5000:5000"]
    env_file: .env
    depends_on: [mongo, redis]
    deploy:
      replicas: 3  # 3 instances behind Nginx
  
  mongo:
    image: mongo:7
    volumes: [mongo_data:/data/db]
  
  redis:
    image: redis:7-alpine
  
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes: [./nginx.conf:/etc/nginx/nginx.conf]

volumes:
  mongo_data:
```

---

## 6. Observability

- **Structured logging** with Winston – JSON logs in production for ELK/Datadog ingestion
- **Error tracking** – plug in Sentry (`@sentry/node`) for production error monitoring
- **Health endpoint** – `/health` for load balancer health checks and uptime monitoring
- **Metrics** – add `prom-client` for Prometheus + Grafana dashboards

---

## 7. API Versioning

All routes are under `/api/v1/`. When breaking changes are needed:
- Create `/api/v2/` routes alongside v1 (no downtime)
- Deprecate v1 with `Sunset` HTTP header
- Run both versions concurrently until clients migrate

---

## Summary

| Concern | Current Solution | At Scale |
|---|---|---|
| Auth | JWT (stateless) | Same – add token blacklist in Redis |
| State | Stateless | Same |
| Database | MongoDB single node | Atlas Replica Set |
| Caching | None | Redis |
| Rate Limiting | In-memory | Redis-backed |
| Deployment | Process direct | Docker + K8s |
| Monitoring | Winston logs | ELK + Sentry + Prometheus |
| Architecture | Modular monolith | Microservices (optional) |

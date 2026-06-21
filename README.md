# ShopAPI

A RESTful e-commerce backend built with **Node.js**, **Express**, **PostgreSQL**, **Prisma**, and **Redis**. Supports user authentication, product catalog with caching, shopping cart, and order management with admin controls.

## Features

- JWT authentication with role-based access (`USER`, `ADMIN`)
- Product catalog with pagination, filtering, sorting, and Redis caching
- Shopping cart (add, update, remove, clear)
- Order placement with shipping address and stock validation
- Admin order management and product CRUD
- Request validation with Zod
- Centralized error handling (Prisma, JWT, validation errors)
- Docker Compose setup for app, PostgreSQL, and Redis

## Tech Stack

| Layer            | Technology              |
| ---------------- | ----------------------- |
| Runtime          | Node.js 22              |
| Framework        | Express 5               |
| Language         | TypeScript              |
| Database         | PostgreSQL 16           |
| ORM              | Prisma 7                |
| Cache            | Redis 7 (ioredis)       |
| Auth             | JWT + bcrypt            |
| Validation       | Zod                     |
| Containerization | Docker & Docker Compose |

## Prerequisites

Choose **one** setup path below.

### For Docker (recommended)

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### For local development

- [Node.js](https://nodejs.org/) 22+
- PostgreSQL 16+
- Redis 7+ (optional — API runs without it, caching is disabled)

---

## Quick Start with Docker

This is the fastest way to run the full stack.

### Step 1 — Clone the repository

```bash
git clone https://github.com/divyachoubisa/shopapi.git
cd shopapi
```

### Step 2 — Create environment file

```bash
cp .env.example .env
```

Edit `.env` and set a strong `JWT_SECRET`. Docker Compose overrides `DATABASE_URL` and `REDIS_URL` for the app container automatically.

### Step 3 — Start all services

```bash
docker compose up --build
```

Wait until you see:

```text
Redis connected
Server running on http://localhost:3000
```

### Step 4 — Seed the database

In a new terminal:

```bash
docker compose exec app npx prisma db seed
```

Default seeded accounts:

| Role  | Email               | Password   |
| ----- | ------------------- | ---------- |
| Admin | `admin@shopapi.com` | `admin123` |
| User  | `user@shopapi.com`  | `user123`  |

### Step 5 — Verify the API

```bash
curl http://localhost:3000/
curl http://localhost:3000/products
```

### Docker commands reference

```bash
# Start in background
docker compose up --build -d

# View logs
docker compose logs -f app

# Stop all services
docker compose down

# Stop and remove volumes (fresh database)
docker compose down -v

# Run migrations inside container
docker compose exec app npx prisma migrate deploy

# Seed database inside container
docker compose exec app npx prisma db seed

# Open Redis CLI inside container
docker compose exec redis redis-cli keys "products:*"
```

---

## Local Development Setup

Use this when developing outside Docker.

### Step 1 — Install dependencies

```bash
npm install
```

### Step 2 — Configure environment

```bash
cp .env.example .env
```

Update `.env` for your local services:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/shopapi"
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=your-long-random-secret
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@shopapi.com
PORT=3000
```

> Use `127.0.0.1` instead of `localhost` for Redis on Windows to avoid IPv4/IPv6 mismatches.

### Step 3 — Start PostgreSQL

Create a database named `shopapi`, then run migrations:

```bash
npx prisma migrate dev
```

Generate the Prisma client after schema changes:

```bash
npm run db:generate
# or: npx prisma generate
```

### Step 4 — Start Redis (optional)

**Docker:**

```bash
docker run -d --name shopapi-redis -p 6379:6379 redis:7-alpine
```

**Verify:**

```bash
docker exec -it shopapi-redis redis-cli ping
# PONG
```

If Redis is not running, the API still starts with: `Redis unavailable — caching disabled`.

### Step 5 — Seed the database

```bash
npm run seed
# or: npx prisma db seed
```

### Step 6 — Start the dev server

```bash
npm run dev
```

API available at **http://localhost:3000**

> Do not run `npm run dev` and `docker compose up` at the same time — both use port 3000.

---

## Environment Variables

| Variable         | Description                                   | Example                                             |
| ---------------- | --------------------------------------------- | --------------------------------------------------- |
| `DATABASE_URL`   | PostgreSQL connection string                  | `postgresql://postgres:pass@localhost:5432/shopapi` |
| `REDIS_URL`      | Redis connection string                       | `redis://127.0.0.1:6379`                            |
| `JWT_SECRET`     | Secret for signing JWT tokens                 | long random string                                  |
| `JWT_EXPIRES_IN` | Token expiry                                  | `7d`                                                |
| `ADMIN_EMAIL`    | Email that gets `ADMIN` role on register/seed | `admin@shopapi.com`                                 |
| `PORT`           | Server port                                   | `3000`                                              |

Copy [`.env.example`](.env.example) to `.env` and fill in your values. Never commit `.env` to Git.

---

## NPM Scripts

| Command               | Description                      |
| --------------------- | -------------------------------- |
| `npm run dev`         | Start dev server with hot reload |
| `npm run build`       | Compile TypeScript to `dist/`    |
| `npm start`           | Run compiled production build    |
| `npm run seed`        | Seed database with sample data   |
| `npm run db:generate` | Regenerate Prisma client         |

---

## Database

### Migrations

```bash
# Create and apply a new migration (local dev)
npx prisma migrate dev --name your_migration_name

# Apply migrations (production / Docker)
npx prisma migrate deploy
```

### Seed

Configured in [`prisma.config.ts`](prisma.config.ts):

```ts
migrations: {
  seed: "tsx prisma/seed.ts",
}
```

```bash
npx prisma db seed
```

### Prisma Studio (optional GUI)

```bash
npx prisma studio
```

---

## Redis Caching

Product endpoints are cached in Redis:

| Key pattern           | TTL    | Endpoint                   |
| --------------------- | ------ | -------------------------- |
| `products:*`          | 5 min  | `GET /products`            |
| `product:{id}`        | 10 min | `GET /products/:id`        |
| `products:categories` | 1 hour | `GET /products/categories` |

Cache is invalidated when products are created, updated, or deleted.

---

## API Reference

Base URL: `http://localhost:3000`

Protected routes require header:

```http
Authorization: Bearer <token>
```

### Health

| Method | Endpoint | Auth   | Description  |
| ------ | -------- | ------ | ------------ |
| GET    | `/`      | Public | Health check |

### Auth — `/auth`

| Method | Endpoint                | Auth   | Description           |
| ------ | ----------------------- | ------ | --------------------- |
| POST   | `/auth/register`        | Public | Register a new user   |
| POST   | `/auth/login`           | Public | Login and receive JWT |
| PATCH  | `/auth/promote/:userId` | Admin  | Promote user to admin |

**Register / Login body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

Login only requires `email` and `password`.

### Products — `/products`

| Method | Endpoint               | Auth   | Description               |
| ------ | ---------------------- | ------ | ------------------------- |
| GET    | `/products`            | Public | List products (paginated) |
| GET    | `/products/categories` | Public | List categories           |
| GET    | `/products/:id`        | Public | Get product by ID         |
| POST   | `/products`            | Admin  | Create product            |
| PATCH  | `/products/:id`        | Admin  | Update product            |
| DELETE | `/products/:id`        | Admin  | Delete product            |

**Query params for `GET /products`:**

- `page` — page number (default: 1)
- `limit` — items per page (default: 10)
- `category` — filter by category
- `sort` — `price_asc`, `price_desc`, or default by date

**Create product body:**

```json
{
  "name": "Wireless Mouse",
  "description": "Ergonomic design",
  "price": 49.99,
  "stock": 100,
  "category": "accessories"
}
```

### Cart — `/cart`

All cart routes require authentication.

| Method | Endpoint    | Description               |
| ------ | ----------- | ------------------------- |
| GET    | `/cart`     | Get current user's cart   |
| POST   | `/cart`     | Add item to cart          |
| PATCH  | `/cart/:id` | Update cart item quantity |
| DELETE | `/cart/:id` | Remove item from cart     |
| DELETE | `/cart`     | Clear entire cart         |

**Add to cart body:**

```json
{
  "productId": 1,
  "quantity": 2
}
```

### Orders — `/orders`

All order routes require authentication.

| Method | Endpoint                          | Auth  | Description           |
| ------ | --------------------------------- | ----- | --------------------- |
| POST   | `/orders`                         | User  | Place order from cart |
| GET    | `/orders`                         | User  | List my orders        |
| GET    | `/orders/:id`                     | User  | Get order by ID       |
| PATCH  | `/orders/:id/cancel`              | User  | Cancel pending order  |
| GET    | `/orders/admin/orders`            | Admin | List all orders       |
| PATCH  | `/orders/admin/orders/:id/status` | Admin | Update order status   |

**Place order body:**

```json
{
  "shippingAddress": "123 Main Street, City, Country 12345"
}
```

**Update order status body:**

```json
{
  "status": "SHIPPED"
}
```

Valid statuses: `PENDING`, `CONFIRMED`, `SHIPPED`, `DELIVERED`, `CANCELLED`

---

## Example Workflow

```bash
# 1. Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@shopapi.com","password":"user123"}'

# 2. Browse products
curl http://localhost:3000/products

# 3. Add to cart (replace TOKEN)
curl -X POST http://localhost:3000/cart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"productId":1,"quantity":1}'

# 4. Place order
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"shippingAddress":"123 Main Street, London, UK"}'
```

---

## Project Structure

```text
shopapi/
├── prisma/
│   ├── migrations/       # Database migrations
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed script
├── src/
│   ├── features/
│   │   ├── auth/         # Authentication
│   │   ├── products/     # Product catalog
│   │   ├── cart/         # Shopping cart
│   │   └── orders/       # Orders
│   ├── lib/
│   │   └── redis.ts      # Redis client
│   ├── middlewares/    # Auth, validation, errors
│   ├── utils/            # Cache, pagination, serializer
│   ├── db.ts             # Prisma client
│   └── index.ts          # App entry point
├── docker-compose.yml
├── Dockerfile
├── prisma.config.ts
└── .env.example
```

---

## Troubleshooting

### `prisma` command not found

Use npx or npm scripts:

```bash
npx prisma generate
npm run db:generate
```

### Port 6379 already in use

Another Redis instance (Docker container, Memurai, WSL) is running:

```bash
docker ps                          # find conflicting container
docker stop shopapi-redis          # stop standalone container
docker compose up --build        # use compose Redis instead
```

### Redis keys appear empty in CLI

On Windows, `redis-cli` may connect to IPv4 while the app uses IPv6:

```bash
redis-cli -h 127.0.0.1 keys "products:*"   # Docker Redis
docker compose exec redis redis-cli keys "products:*"
```

### Docker app can't reach database

Inside Docker, use service names — not `localhost`:

- Database host: `db`
- Redis host: `redis`

These are configured in [`docker-compose.yml`](docker-compose.yml).

### TypeScript errors after schema change

Run both after editing `schema.prisma`:

```bash
npx prisma migrate dev
npx prisma generate
```

### Memurai won't start on Windows

Port 6379 is likely taken by Docker Redis. Use Docker Redis instead or stop the conflicting service.

---

## License

ISC

# ShopAPI

A production-grade e-commerce REST API built with Node.js, TypeScript, and PostgreSQL. Features JWT authentication, persistent cart and order management with database transactions, Redis caching, and AI-powered semantic product search using vector embeddings.

**Live API:** https://shopapi-production-129d.up.railway.app

---

## Tech stack

| Technology                | Role                   | Why                                             |
| ------------------------- | ---------------------- | ----------------------------------------------- |
| Node.js + Express         | HTTP server            | Lightweight, non-blocking I/O                   |
| TypeScript                | Language               | Type safety, better DX                          |
| PostgreSQL + Prisma       | Primary database + ORM | Relational data, type-safe queries              |
| Redis (Memurai)           | Caching                | Sub-millisecond product listing                 |
| pgvector                  | Vector search          | Semantic search without a separate vector DB    |
| Cohere API                | Embeddings             | Free tier, 1024-dim embeddings for production   |
| Ollama + nomic-embed-text | Local embeddings       | Free, offline embeddings for development        |
| Zod                       | Validation             | Schema-first validation with inferred types     |
| JWT                       | Authentication         | Stateless auth with role-based access           |
| Docker + Docker Compose   | Containerization       | One-command local setup                         |
| Railway                   | Deployment             | Native Docker support, managed Postgres + Redis |

---

## Features

### Authentication & authorization

- Register and login with JWT tokens
- Role-based access control — `USER` and `ADMIN` roles
- Admin auto-assigned via `ADMIN_EMAIL` environment variable
- Admin promotion endpoint — admins can promote other users
- Password hashing with bcrypt

### Products

- Browse with filtering by category, sorting by price, and pagination
- Category listing endpoint
- Admin-only create, update, and delete
- Redis cache on listing and detail endpoints with automatic invalidation on mutation

### Cart

- Persistent cart stored in PostgreSQL — survives logout and works across devices
- Add items, update quantity, remove items, clear cart
- Stock validation on every operation
- Automatic cart merge for duplicate products

### Orders

- Place an order from the current cart using a **database transaction** — atomically creates the order, reduces stock for every product, and clears the cart in a single operation. If any step fails, everything rolls back.
- Cancel pending orders with automatic stock restoration (also transactional)
- Order history with pagination
- Admin order management — view all orders, update status through the full lifecycle

### AI semantic search

- Natural language product search — "something for college work" returns laptops, "music without disturbing others" returns headphones
- Embeddings generated at product creation and stored in PostgreSQL via pgvector
- HNSW index for fast approximate nearest-neighbour search
- Provider-agnostic embedding layer — Ollama locally, Cohere in production, switchable via environment variable

---

## Architecture decisions

**Why pgvector instead of Pinecone or a dedicated vector database?**
Products already live in PostgreSQL. pgvector adds vector storage and similarity search as a native extension — no second system to manage, no syncing, no extra cost. Most importantly, vector search can be combined with ordinary SQL filters (category, stock, price) in a single query. This is significantly harder with a dedicated vector database. At the scale of this project (thousands of products, not hundreds of millions), pgvector performs identically to purpose-built alternatives.

**Why database transactions for orders?**
Placing an order is a multi-step write operation: create the order record, create order items, reduce stock for every product, and clear the cart. If any step fails after others have succeeded, the database is left in an inconsistent state — an order exists but stock was never reduced, or stock was reduced but the order was never confirmed. Wrapping all steps in a Prisma transaction guarantees atomicity: either everything succeeds or everything rolls back, with no partial state possible.

**Why Redis caching on products?**
Product listing is the most frequently hit endpoint and the most expensive — it runs a COUNT query alongside a paginated SELECT, both hitting the database. Caching the response in Redis for 5 minutes eliminates repeated database load for identical requests. Cache keys are built from the full query string so different filters cache independently. Any mutation (create, update, delete) invalidates all product list caches immediately via key pattern deletion.

**Why a provider-agnostic embedding layer?**
Embedding providers differ in cost, availability, and dimension count. Hardcoding one provider couples the application to that vendor's availability and pricing. The `generateEmbedding()` abstraction lets the provider switch via a single environment variable — Ollama for free offline development, Cohere for production — without any controller or route code changing.

---

## Local setup

### Prerequisites

- Node.js 20+
- Docker Desktop
- Ollama (for local AI search) — download from ollama.com

### 1. Clone and install

```bash
git clone git@github-personal:divyachoubisa/shopapi.git
cd shopapi
npm install
```

### 2. Copy environment variables

```bash
cp .env.example .env
```

Fill in your values — see the [Environment variables](#environment-variables) section below.

### 3. Start infrastructure

```bash
docker compose up -d
```

This starts PostgreSQL (with pgvector), a shadow PostgreSQL for Prisma migrations, and Redis. Your Node.js app runs outside Docker in development.

### 4. Enable pgvector and run migrations

```bash
# enable extension
docker compose exec db psql -U postgres -d shopapi -c "CREATE EXTENSION IF NOT EXISTS vector;"
docker compose exec db_shadow psql -U postgres -d shopapi_shadow -c "CREATE EXTENSION IF NOT EXISTS vector;"

# run migrations
npx prisma migrate dev

# add the embedding column (not managed by Prisma)
docker compose exec db psql -U postgres -d shopapi -c "ALTER TABLE \"Product\" ADD COLUMN IF NOT EXISTS embedding vector(768);"
```

### 5. Seed the database

```bash
npm run seed
```

This creates 10 sample products and an admin account using the `ADMIN_EMAIL` from your `.env`.

### 6. Pull the embedding model (for AI search)

```bash
ollama pull nomic-embed-text
```

### 7. Generate embeddings for seeded products

```bash
npm run backfill
```

### 8. Start the server

```bash
npm run dev
```

Server runs at `http://localhost:3000`.

---

## API documentation

### Auth

| Method | Path                    | Auth   | Description           |
| ------ | ----------------------- | ------ | --------------------- |
| POST   | `/auth/register`        | Public | Create account        |
| POST   | `/auth/login`           | Public | Login, returns JWT    |
| PATCH  | `/auth/promote/:userId` | Admin  | Promote user to admin |

### Products

| Method | Path                   | Auth   | Description                            |
| ------ | ---------------------- | ------ | -------------------------------------- |
| GET    | `/products`            | Public | List products (filter, sort, paginate) |
| GET    | `/products/categories` | Public | List all categories                    |
| GET    | `/products/search?q=`  | Public | AI semantic search                     |
| GET    | `/products/:id`        | Public | Get single product                     |
| POST   | `/products`            | Admin  | Create product                         |
| PATCH  | `/products/:id`        | Admin  | Update product                         |
| DELETE | `/products/:id`        | Admin  | Delete product                         |

**Product query params:**

- `?category=laptops` — filter by category
- `?sort=price_asc` or `?sort=price_desc` — sort by price
- `?page=2&limit=10` — pagination (limit capped at 100)
- `?q=something for college work` — natural language search

### Cart

All cart endpoints require a valid JWT token.

| Method | Path        | Description                         |
| ------ | ----------- | ----------------------------------- |
| GET    | `/cart`     | View cart with total                |
| POST   | `/cart`     | Add item `{ productId, quantity }`  |
| PATCH  | `/cart/:id` | Update item quantity `{ quantity }` |
| DELETE | `/cart/:id` | Remove item                         |
| DELETE | `/cart`     | Clear entire cart                   |

### Orders

All order endpoints require a valid JWT token.

| Method | Path                              | Auth  | Description                       |
| ------ | --------------------------------- | ----- | --------------------------------- |
| POST   | `/orders`                         | User  | Place order from cart             |
| GET    | `/orders`                         | User  | My order history                  |
| GET    | `/orders/:id`                     | User  | Single order                      |
| PATCH  | `/orders/:id/cancel`              | User  | Cancel pending order              |
| GET    | `/orders/admin/orders`            | Admin | All orders (filterable by status) |
| PATCH  | `/orders/admin/orders/:id/status` | Admin | Update order status               |

**Order status flow:** `PENDING` → `CONFIRMED` → `SHIPPED` → `DELIVERED` (or `CANCELLED` from `PENDING`)

---

## Environment variables

| Variable              | Description                                     | Example                                                    |
| --------------------- | ----------------------------------------------- | ---------------------------------------------------------- |
| `DATABASE_URL`        | PostgreSQL connection string                    | `postgresql://postgres:pass@localhost:5432/shopapi`        |
| `SHADOW_DATABASE_URL` | Prisma shadow database (dev only)               | `postgresql://postgres:pass@localhost:5433/shopapi_shadow` |
| `REDIS_URL`           | Redis connection string                         | `redis://127.0.0.1:6379`                                   |
| `JWT_SECRET`          | Secret for signing JWT tokens                   | 64-byte hex string                                         |
| `JWT_EXPIRES_IN`      | Token expiry                                    | `7d`                                                       |
| `ADMIN_EMAIL`         | Email that auto-receives ADMIN role on register | `admin@yourdomain.com`                                     |
| `EMBEDDING_PROVIDER`  | `ollama` for local, `cohere` for production     | `ollama`                                                   |
| `OLLAMA_URL`          | Ollama server URL (local only)                  | `http://127.0.0.1:11434`                                   |
| `COHERE_API_KEY`      | Cohere API key (production only)                | `co-...`                                                   |
| `PORT`                | Server port                                     | `3000`                                                     |

---

## Project structure

```
src/
├── config/
│   └── env.ts                  # centralised env variable access
├── features/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.routes.ts
│   │   └── auth.schema.ts
│   ├── products/
│   │   ├── product.controller.ts
│   │   ├── product.routes.ts
│   │   └── product.schema.ts
│   ├── cart/
│   │   ├── cart.controller.ts
│   │   ├── cart.routes.ts
│   │   └── cart.schema.ts
│   └── orders/
│       ├── order.controller.ts
│       ├── order.routes.ts
│       └── order.schema.ts
├── lib/
│   ├── embeddings.ts           # provider-agnostic embedding layer
│   └── redis.ts                # Redis client
├── middlewares/
│   ├── auth.middleware.ts      # JWT verification + role check
│   ├── validate.middleware.ts  # Zod request validation
│   ├── error.middleware.ts     # global error handler
│   └── notFound.middleware.ts  # 404 handler
├── scripts/
│   └── backfill-embeddings.ts  # one-time embedding generation
├── utils/
│   ├── cache.ts                # Redis cache helpers
│   ├── pagination.ts           # reusable pagination logic
│   └── serializer.ts           # Decimal → number conversion
├── db.ts                       # Prisma client
└── index.ts                    # Express app entry point
prisma/
├── schema.prisma               # database schema
├── migrations/                 # migration history
└── seed.ts                     # sample data
```

---

## Credentials for testing

The seed script creates two accounts:

| Role  | Email             | Password |
| ----- | ----------------- | -------- |
| Admin | admin@shopapi.com | admin123 |
| User  | user@shopapi.com  | user123  |

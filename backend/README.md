# TODO App - Backend

Node.js + Express + PostgreSQL backend for duty/task management API.

## Requirements

- **Node.js** >= 22.x
- **PostgreSQL** >= 14.x

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy and configure environment variables
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# 3. Create database (if not exists)
psql -U postgres -c "CREATE DATABASE todoapp;"

# 4. Start development server
npm run dev
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Run in development mode (auto-reload with tsx) |
| `npm run build` | Build TypeScript for production |
| `npm start` | Start production server |
| `npm run migrate` | Run database migrations manually |
| `npm run seed` | Seed database with 50 sample duties |
| `npm run seed -- --force` | Reset and seed database |
| `npm test` | Run Jest tests |

## Environment Variables

Create a `.env` file in the `src/backend` directory:

```env
# Database Connection
DB_HOST=localhost
DB_PORT=5432
DB_NAME=todoapp
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_POOL_SIZE=10

# Server
PORT=3000

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

## Database Schema

### duties table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (auto-generated) |
| title | VARCHAR(255) | Duty title (required) |
| description | TEXT | Detailed description |
| status | VARCHAR(50) | pending, in_progress, completed, cancelled |
| priority | VARCHAR(20) | low, medium, high, urgent |
| start_date | DATE | When duty starts |
| due_date | DATE | When duty should be completed |
| notes | TEXT | Additional notes |
| completed | BOOLEAN | Completion flag |
| completed_at | TIMESTAMP | Exact completion time |
| deleted_at | TIMESTAMP | Soft delete timestamp (null = active) |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

## Migrations

Migrations are stored in `src/db/migrations/` as `.sql` files and run automatically on server startup.

### Creating a New Migration

1. Create a new `.sql` file in `src/db/migrations/`
2. Use naming convention: `XXX_description.sql` (e.g., `002_add_priority.sql`)
3. Add your SQL commands (CREATE TABLE, ALTER TABLE, etc.)
4. Restart the server - migration runs automatically

### Manual Migration

```bash
npm run migrate
```

## API Documentation

### Base URL

```
http://localhost:3000/api
```

### Health Check

```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "connected"
}
```

### Duties API

#### List Duties

```bash
GET /api/duties
```

Query Parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Current page |
| limit | number | 10 | Items per page (max: 100) |
| status | string | - | Filter by status |
| priority | string | - | Filter by priority |
| completed | boolean | - | Filter by completion |
| search | string | - | Search in title & description |
| sort_by | string | created_at | Sort field |
| sort_order | string | desc | Sort direction (asc/desc) |

Example:
```bash
# Get 20 pending duties, page 1, sorted by priority
curl "http://localhost:3000/api/duties?page=1&limit=20&status=pending&priority=high&sort_by=priority&sort_order=desc"

# Search for "meeting"
curl "http://localhost:3000/api/duties?search=meeting"
```

Response:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

#### Get Single Duty

```bash
GET /api/duties/:id
```

#### Create Duty

```bash
POST /api/duties
Content-Type: application/json

{
  "title": "Complete project",
  "description": "Finish the TODO app",
  "status": "pending",
  "priority": "high",
  "due_date": "2024-01-20"
}
```

#### Update Duty

```bash
PUT /api/duties/:id
Content-Type: application/json

{
  "title": "Updated title",
  "completed": true
}
```

#### Delete Duty (Soft Delete)

```bash
DELETE /api/duties/:id
```

## Logging & Observability

The backend uses structured logging with timestamps:

```
[Migration] Starting...
[Migration] Running: 001_initial_schema.sql
[Migration] Completed: 001_initial_schema.sql
[Migration] All migrations completed successfully!
[Server] Starting TODO App Backend...
[Server] Running at http://localhost:3000
[Server] API available at http://localhost:3000/api
```

All logs include timestamps and categories for easy debugging.

## Project Structure

```
src/
├── db/
│   ├── connection.ts    # PostgreSQL connection pool
│   ├── migrate.ts       # Migration runner
│   ├── migrate-cli.ts   # CLI migration command
│   ├── seed.ts          # Sample data seeder
│   └── migrations/     # SQL migration files
├── routes/
│   ├── index.ts         # Route aggregator
│   └── duties.routes.ts # Duty endpoints
├── services/
│   └── duties.service.ts # Business logic
├── middleware/
│   └── errorHandler.ts  # Error handling
├── types/
│   └── duty.ts          # TypeScript types
├── index.ts             # Entry point
└── .env.example         # Environment template
```

## Testing

```bash
npm test
```

Tests are written with Jest and cover services and routes.

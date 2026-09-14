# TODO App - Backend

Node.js + Express + PostgreSQL backend for duty/task management.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Run in development mode |
| `npm run migrate` | Run database migrations |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm test` | Run Jest tests |

## Environment Variables

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=todoapp
DB_USER=postgres
DB_PASSWORD=your_password
DB_POOL_SIZE=10
PORT=3000
```

## Database Schema

### duties table

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| title | VARCHAR(255) | Duty title (required) |
| description | TEXT | Detailed description |
| status | VARCHAR(50) | pending, in_progress, completed, cancelled |
| priority | VARCHAR(20) | low, medium, high, urgent |
| start_date | DATE | When duty starts |
| end_date | DATE | When duty should be completed |
| notes | TEXT | Additional notes |
| completed | BOOLEAN | Completion flag |
| completed_at | TIMESTAMP | Exact completion time |
| deleted_at | TIMESTAMP | Soft delete timestamp (null = active) |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

Migrations are stored in `src/db/migrations/` as `.sql` files. They run automatically on server start.

### Creating a New Migration

1. Create a new `.sql` file in `src/db/migrations/`
2. Use naming convention: `XXX_description.sql` (e.g., `002_add_priority.sql`)
3. Add your SQL commands (CREATE TABLE, ALTER TABLE, etc.)
4. Restart the server - migration runs automatically

### Manual Migration

```bash
npm run migrate
```

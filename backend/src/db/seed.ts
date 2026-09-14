// src/db/seed.ts
// Seed script to populate database with sample duties
// Usage: npm run seed
// Use --force to re-seed even if duties exist

import { config } from 'dotenv';
import { query, closePool } from './connection';

config();

// Sample data for random generation
const titles = [
  'Complete project proposal',
  'Review pull requests',
  'Fix login bug',
  'Write unit tests',
  'Update documentation',
  'Deploy to staging',
  'Code review meeting',
  'Refactor authentication',
  'Optimize database queries',
  'Add error logging',
  'Setup CI/CD pipeline',
  'Write API documentation',
  'Fix responsive layout',
  'Add unit tests for service',
  'Review security audit',
  'Update dependencies',
  'Fix memory leak',
  'Implement caching',
  'Write technical specs',
  'Fix CSS issues',
  'Add integration tests',
  'Review architecture design',
  'Setup monitoring',
  'Fix timezone bug',
  'Implement search feature',
  'Add pagination',
  'Fix form validation',
  'Write user guide',
  'Optimize images',
  'Add rate limiting',
  'Fix pagination bug',
  'Implement sorting',
  'Add dark mode',
  'Fix email notifications',
  'Write migration script',
  'Review database schema',
  'Add input sanitization',
  'Fix accessibility issues',
  'Implement file upload',
  'Add loading states',
  'Fix modal overlay',
  'Write API tests',
  'Review code quality',
  'Add logging middleware',
  'Fix session timeout',
  'Implement data export',
  'Add backup strategy',
  'Fix file permissions',
  'Write changelog'
];

const descriptions = [
  'Please complete this as soon as possible',
  'Medium priority task, can be done this week',
  'Low priority, do when you have time',
  'Urgent - needs immediate attention',
  'This is a recurring task',
  'Blocked by another task',
  'Waiting for client feedback',
  'Ready for review',
  'Needs testing before release',
  'Good first issue for new developers',
  null
];

const priorities = ['low', 'medium', 'high', 'urgent'] as const;
const statuses = ['pending', 'in_progress', 'completed', 'cancelled'] as const;

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysAgo: number, daysAhead: number): string | null {
  if (Math.random() > 0.7) return null;
  
  const today = new Date();
  const randomDays = Math.floor(Math.random() * (daysAhead + daysAgo)) - daysAgo;
  const date = new Date(today);
  date.setDate(date.getDate() + randomDays);
  
  return date.toISOString().split('T')[0];
}

function randomNotes(): string | null {
  if (Math.random() > 0.6) return null;
  const notes = [
    'Remember to check edge cases',
    'This requires external API',
    'Need more information from client',
    'Will take approximately 2 hours',
    'Can be split into smaller tasks',
    'Already in progress',
    'Waiting for dependencies'
  ];
  return randomItem(notes);
}

async function seed(): Promise<void> {
  const force = process.argv.includes('--force');
  
  console.log('[Seed] Starting database seeding...\n');
  
  // Check if duties already exist
  const existing = await query<{ count: string }>('SELECT COUNT(*) as count FROM duties');
  const existingCount = parseInt(existing.rows[0].count, 10);
  
  if (existingCount > 0 && !force) {
    console.log(`[Seed] Database already has ${existingCount} duties. Use --force to re-seed.`);
    await closePool();
    return;
  }
  
  // Clear existing duties if forcing
  if (existingCount > 0 && force) {
    console.log(`[Seed] Clearing ${existingCount} existing duties...`);
    await query('DELETE FROM duties');
  }
  
  const duties: unknown[] = [];
  
  for (let i = 0; i < 50; i++) {
    const status = randomItem(statuses);
    const completed = status === 'completed';
    
    duties.push({
      title: titles[i % titles.length] + (i >= titles.length ? ` #${Math.floor(i / titles.length) + 1}` : ''),
      description: randomItem(descriptions),
      status: status,
      priority: randomItem(priorities),
      start_date: randomDate(30, 0),
      end_date: randomDate(0, 60),
      notes: randomNotes(),
      completed: completed,
      completed_at: completed ? new Date().toISOString() : null
    });
  }
  
  // Batch insert
  console.log(`[Seed] Inserting ${duties.length} duties...`);
  
  for (const duty of duties) {
    const d = duty as Record<string, unknown>;
    await query(`
      INSERT INTO duties (title, description, status, priority, start_date, end_date, notes, completed, completed_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      d.title,
      d.description,
      d.status,
      d.priority,
      d.start_date,
      d.end_date,
      d.notes,
      d.completed,
      d.completed_at
    ]);
  }
  
  console.log(`[Seed] Successfully seeded ${duties.length} duties!\n`);
  
  await closePool();
}

seed().catch((error) => {
  console.error('[Seed] Failed:', error);
  process.exit(1);
});

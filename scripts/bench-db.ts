import 'reflect-metadata';
import { DataSource } from 'typeorm';
import configuration from '../src/common/config/configuration';
import * as dotenv from 'dotenv';

// ------------------------------------------------------------
// Simple DB Benchmark Script
// Measures query performance for critical database operations
// Useful for spotting slow queries and regression in auth/session paths
//
// Usage:
// npx ts-node scripts/bench-db.ts
// ------------------------------------------------------------

dotenv.config();

async function main() {
  // ------------------------------------------------------------
  // Resolve database connection URL from multiple fallback sources
  // This allows flexibility across environments (dev/staging/prod)
  // ------------------------------------------------------------
  const dbUrl =
    process.env.DATABASE_URL ||
    process.env.APP_DATABASE_URL ||
    process.env.DB_URL ||
    process.env.DB;

  if (!dbUrl) {
    console.error('Please set DATABASE_URL in your environment');
    process.exit(1);
  }

  // ------------------------------------------------------------
  // Initialize TypeORM DataSource
  // Dynamically loads entity definitions from compiled source
  // ------------------------------------------------------------
  const dataSource = new DataSource({
    type: 'postgres',
    url: dbUrl,
    entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
  });

  await dataSource.initialize();

  // ------------------------------------------------------------
  // Benchmark 1: Auth lookup by email
  // This simulates login flow performance (critical path)
  // ------------------------------------------------------------
  const email = process.env.BENCH_EMAIL || 'bench@example.com';
  const userRepo = dataSource.getRepository('users');

  const start = Date.now();
  await userRepo.findOne({ where: { email } });
  const ms = Date.now() - start;
  console.log(`findOne by email: ${ms} ms`);

  // ------------------------------------------------------------
  // Benchmark 2: QueryBuilder auth query
  // Tests performance of selective field fetching (optimized auth query)
  // ------------------------------------------------------------
  const start2 = Date.now();
  await userRepo
    .createQueryBuilder('user')
    .select(['user.id', 'user.email', 'user.password'])
    .where('user.email = :email', { email })
    .getOne();
  const ms2 = Date.now() - start2;
  console.log(`queryBuilder select auth fields: ${ms2} ms`);

  // ------------------------------------------------------------
  // Benchmark 3: Game session listing (simple repository query)
  // Used to evaluate basic pagination / user history retrieval speed
  // ------------------------------------------------------------
  const sessionsRepo = dataSource.getRepository('game_sessions');

  const start3 = Date.now();
  await sessionsRepo.find({
    where: { userId: process.env.BENCH_USER_ID || '' },
    take: 20,
  });
  const ms3 = Date.now() - start3;
  console.log(`find sessions (relations off): ${ms3} ms`);

  // ------------------------------------------------------------
  // Benchmark 4: Optimized session query using QueryBuilder
  // Tests performance of explicit column selection + filtering
  // ------------------------------------------------------------
  const start4 = Date.now();
  await sessionsRepo
    .createQueryBuilder('gs')
    .select([
      'gs.id',
      'gs.userId',
      'gs.challengeId',
      'gs.score',
      'gs.duration',
      'gs.createdAt',
    ])
    .where('gs.userId = :userId', {
      userId: process.env.BENCH_USER_ID || '',
    })
    .limit(20)
    .getMany();

  const ms4 = Date.now() - start4;
  console.log(`queryBuilder sessions summary: ${ms4} ms`);

  // ------------------------------------------------------------
  // Cleanup: close DB connection
  // Ensures no hanging connections in CI or local runs
  // ------------------------------------------------------------
  await dataSource.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
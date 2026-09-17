// Time-ordered migration runner. Applies every *.sql file in ./migrations once,
// tracking applied files in a `_migrations` table.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { ensureDatabase } from './pool.js';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, 'migrations');

// Applies pending migrations. Used by `npm run migrate` and automatically by the
// server on startup (server/index.js), so a deploy never runs with a stale schema.
export async function runMigrations() {
  await ensureDatabase();
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ruaa_healthcare',
    multipleStatements: true,
  });

  await conn.query(
    `CREATE TABLE IF NOT EXISTS _migrations (
       name VARCHAR(190) PRIMARY KEY,
       applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
  );

  const [done] = await conn.query('SELECT name FROM _migrations');
  const applied = new Set(done.map((r) => r.name));
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`= skip ${file}`);
      continue;
    }
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    try {
      await conn.query(sql);
    } catch (e) {
      e.message = `${file} — ${e.message}`;   // the file name is what you need first
      await conn.end().catch(() => {});
      throw e;
    }
    await conn.query('INSERT INTO _migrations (name) VALUES (?)', [file]);
    console.log(`+ applied ${file}`);
  }

  await conn.end();
  console.log('Migrations complete.');
}

// CLI entry: `node server/db/migrate.js`
const isCli = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isCli) {
  runMigrations().catch((e) => {
    console.error('Migration failed:', e.message);
    process.exit(1);
  });
}

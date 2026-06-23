// Database abstraction layer.
// Mirrors the PlayTix 2.0 approach: a single pool module that the rest of the
// server talks to, so the underlying engine can be swapped without touching
// business logic. MySQL (mysql2) is the production driver.
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const {
  DB_HOST = '127.0.0.1',
  DB_PORT = '3306',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'ruaa_healthcare',
} = process.env;

// A pool is created lazily so that migration scripts can connect without a
// pre-existing database (see ensureDatabase).
let pool;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: DB_HOST,
      port: Number(DB_PORT),
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      charset: 'utf8mb4_unicode_ci',
      namedPlaceholders: true,
    });
  }
  return pool;
}

// Used by the migration runner: connects without selecting a database and
// creates it (utf8mb4 for full Arabic + emoji support) if missing.
export async function ensureDatabase() {
  // On local/dev (e.g. XAMPP) we can create the database. On shared hosting
  // (Hostinger) the database is pre-created in the panel and the user usually
  // lacks CREATE DATABASE privilege — so we ignore any error here.
  try {
    const conn = await mysql.createConnection({
      host: DB_HOST,
      port: Number(DB_PORT),
      user: DB_USER,
      password: DB_PASSWORD,
      multipleStatements: true,
    });
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await conn.end();
  } catch (e) {
    console.warn('ensureDatabase skipped (DB likely pre-created):', e.code || e.message);
  }
}

// Thin query helper. Returns rows for SELECT, the result header otherwise.
export async function query(sql, params = {}) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

export async function closePool() {
  if (pool) await pool.end();
}

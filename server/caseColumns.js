// Insurance-case "referrer" columns, added in JS at startup (same approach as
// hero.js): the .sql migration route is not reliable on the production MySQL.
// Each column is added on its own; a failure never blocks the server, and the
// case queries fall back to the old column set while a column is missing.
import { query } from './db/pool.js';

export const REFERRER_COLUMNS = [
  ['submitted_by_user_id', 'INT NULL'],
  ['submitted_by_name', 'VARCHAR(190) NULL'],
  ['coordinator_name', 'VARCHAR(190) NULL'],
  ['coordinator_phone', 'VARCHAR(60) NULL'],
  ['source', 'VARCHAR(20) NULL'],
];

let ready = false;
export const caseReferrerReady = () => ready;

export async function caseColumns() {
  const rows = await query(
    `SELECT COLUMN_NAME AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'insurance_cases'`
  );
  return new Set(rows.map((r) => r.c || r.COLUMN_NAME));
}

export async function ensureCaseColumns() {
  let have = new Set();
  try { have = await caseColumns(); } catch (e) { console.warn('[cases] column check skipped:', e.message); }
  for (const [name, type] of REFERRER_COLUMNS) {
    if (have.has(name)) continue;
    try {
      await query(`ALTER TABLE insurance_cases ADD COLUMN ${name} ${type}`);
      console.log(`[cases] added column ${name}`);
    } catch (e) {
      if (/Duplicate column/i.test(e.message)) continue;
      console.error(`[cases] could not add ${name}:`, e.message);
    }
  }
  try { have = await caseColumns(); } catch {}
  ready = REFERRER_COLUMNS.every(([c]) => have.has(c));
  console.log(`[cases] referrer columns ${ready ? 'ready' : 'missing — running without them'}`);
  return ready;
}

// 应用 SQL 迁移文件到 Supabase Postgres（通过 SUPABASE_DB_URL 直连）。
// 用法：node scripts/db/apply.mjs supabase/migrations/0001_init.sql
import { readFileSync } from 'node:fs';
import pg from 'pg';

const file = process.argv[2];
if (!file) {
  console.error('用法: node scripts/db/apply.mjs <sql文件路径>');
  process.exit(1);
}
const url = process.env.SUPABASE_DB_URL;
if (!url) throw new Error('缺少 SUPABASE_DB_URL');

const sql = readFileSync(file, 'utf8');
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

await client.connect();
try {
  await client.query(sql);
  console.log(`✅ 已应用迁移: ${file}`);
} catch (e) {
  console.error(`❌ 迁移失败: ${e.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}

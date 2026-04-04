import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false, checkServerIdentity: () => undefined },
});

await client.connect();
console.log('Connected to Supabase PostgreSQL');

const sql = `
-- Create enums
DO $$ BEGIN
  CREATE TYPE role AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE severity AS ENUM ('healthy', 'warning', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  "openId" VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  "loginMethod" VARCHAR(64),
  role role NOT NULL DEFAULT 'user',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "lastSignedIn" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create scans table
CREATE TABLE IF NOT EXISTS scans (
  id SERIAL PRIMARY KEY,
  "userId" VARCHAR(64),
  "imageUrl" TEXT NOT NULL,
  "imageKey" TEXT NOT NULL,
  prediction VARCHAR(64) NOT NULL,
  confidence REAL NOT NULL,
  severity severity NOT NULL,
  "confidenceBreakdown" JSONB,
  notes TEXT,
  location VARCHAR(255),
  synced TEXT NOT NULL DEFAULT 'synced',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scans_userId ON scans("userId");
CREATE INDEX IF NOT EXISTS idx_scans_createdAt ON scans("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_users_openId ON users("openId");
`;

try {
  await client.query(sql);
  console.log('✅ Tables created successfully!');
  
  // Verify
  const res = await client.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name IN ('users', 'scans')
    ORDER BY table_name;
  `);
  console.log('Tables in database:', res.rows.map(r => r.table_name));
} catch (err) {
  console.error('Error creating tables:', err.message);
} finally {
  await client.end();
}

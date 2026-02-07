import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

export const pool = new Pool({ connectionString });

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id SERIAL PRIMARY KEY,
      model VARCHAR(100) NOT NULL UNIQUE,
      name VARCHAR(200) NOT NULL,
      brand VARCHAR(100),
      spec VARCHAR(200),
      batch VARCHAR(100),
      qty INT NOT NULL DEFAULT 0 CHECK (qty >= 0),
      remark TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await pool.query(`
    DROP TRIGGER IF EXISTS trg_inventory_items_updated_at ON inventory_items;
    CREATE TRIGGER trg_inventory_items_updated_at
    BEFORE UPDATE ON inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  `);
}

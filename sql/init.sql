CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  wecom_userid VARCHAR(128) UNIQUE NOT NULL,
  name VARCHAR(128),
  department TEXT,
  role VARCHAR(16) NOT NULL DEFAULT 'sales',
  last_login_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  channel_owner VARCHAR(128) NOT NULL,
  model VARCHAR(128) NOT NULL,
  name VARCHAR(128) NOT NULL,
  spec VARCHAR(256) NOT NULL,
  version VARCHAR(64) NOT NULL DEFAULT '2026年1.0',
  primary_secondary VARCHAR(32),
  grade VARCHAR(32),
  price NUMERIC(12,2),
  price_control NUMERIC(12,2),
  policy TEXT,
  remark TEXT,
  updated_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT products_version_key UNIQUE(version, model, spec, channel_owner)
);

CREATE TABLE IF NOT EXISTS change_logs (
  id SERIAL PRIMARY KEY,
  product_id INTEGER,
  changed_by INTEGER REFERENCES users(id),
  changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  diff_json JSONB,
  action VARCHAR(16) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS versions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(64) UNIQUE NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO versions(name) VALUES ('2026年1.0') ON CONFLICT (name) DO NOTHING;

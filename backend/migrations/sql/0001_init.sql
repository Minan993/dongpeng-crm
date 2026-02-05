-- MVP init schema for Dongpeng CRM (PostgreSQL)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code varchar(32) UNIQUE NOT NULL,
  name varchar(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  username varchar(64) UNIQUE NOT NULL,
  password_hash varchar(255) NOT NULL,
  real_name varchar(64) NOT NULL,
  mobile varchar(20),
  is_active boolean NOT NULL DEFAULT true,
  force_change_password boolean NOT NULL DEFAULT true,
  created_at timestamp without time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid NOT NULL,
  role_id uuid NOT NULL,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code varchar(64) UNIQUE NOT NULL,
  name varchar(128) NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id uuid NOT NULL,
  permission_id uuid NOT NULL,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(64) NOT NULL,
  mobile varchar(20) NOT NULL,
  source varchar(32) NOT NULL DEFAULT '自然到店',
  stage varchar(16) NOT NULL DEFAULT 'new',
  owner_id uuid,
  next_followup_at timestamp without time zone,
  created_at timestamp without time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_leads_stage_created ON leads(stage, created_at DESC);

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(64) NOT NULL,
  mobile varchar(20) UNIQUE NOT NULL,
  wechat varchar(64),
  address varchar(255),
  tags varchar(255),
  created_at timestamp without time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS followups (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL,
  content text NOT NULL,
  method varchar(16) NOT NULL DEFAULT '电话',
  next_followup_at timestamp without time zone,
  created_at timestamp without time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_followups_customer_created ON followups(customer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS measures (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL,
  appointment_time timestamp without time zone,
  designer varchar(64),
  status varchar(32) NOT NULL DEFAULT 'pending',
  created_at timestamp without time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL,
  version_no integer NOT NULL DEFAULT 1,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  approve_status varchar(32) NOT NULL DEFAULT 'draft',
  created_at timestamp without time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_info (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_no varchar(64) UNIQUE NOT NULL,
  customer_id uuid NOT NULL,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  paid_amount numeric(12,2) NOT NULL DEFAULT 0,
  status varchar(32) NOT NULL DEFAULT 'draft',
  created_at timestamp without time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_order_status_created ON order_info(status, created_at DESC);

CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_no varchar(64) UNIQUE NOT NULL,
  customer_id uuid NOT NULL,
  type varchar(32) NOT NULL DEFAULT '补货',
  status varchar(32) NOT NULL DEFAULT 'open',
  created_at timestamp without time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS visits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL,
  satisfaction_score integer,
  comment text,
  created_at timestamp without time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  biz_type varchar(32) NOT NULL,
  biz_id varchar(64) NOT NULL,
  action varchar(32) NOT NULL,
  detail text,
  operator varchar(64) NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_biz ON audit_logs(biz_type, biz_id, created_at DESC);

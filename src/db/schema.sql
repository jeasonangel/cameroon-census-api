-- Cameroon Census API schema
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. users
CREATE TABLE IF NOT EXISTS users (
  id                SERIAL PRIMARY KEY,
  email             VARCHAR(255) UNIQUE NOT NULL,
  password_hash     VARCHAR(255) NOT NULL,
  full_name         VARCHAR(255) NOT NULL,
  organization      VARCHAR(255),
  user_type         VARCHAR(50) NOT NULL,
  is_active         BOOLEAN DEFAULT FALSE,
  is_verified       BOOLEAN DEFAULT FALSE,
  monthly_limit     INTEGER NOT NULL,
  requests_used     INTEGER DEFAULT 0,
  is_unlimited      BOOLEAN DEFAULT FALSE,
  unlimited_expires TIMESTAMP,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login        TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. api_keys
CREATE TABLE IF NOT EXISTS api_keys (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  key_hash    VARCHAR(255) UNIQUE NOT NULL,
  key_prefix  VARCHAR(16) NOT NULL,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used   TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);

-- 3. spatial_geo (PostGIS)
CREATE TABLE IF NOT EXISTS spatial_geo (
  id         SERIAL PRIMARY KEY,
  code       VARCHAR(10) UNIQUE,
  name       VARCHAR(100) NOT NULL,
  level      VARCHAR(20) NOT NULL,
  parent_id  INTEGER REFERENCES spatial_geo(id),
  population INTEGER,
  area_km2   DECIMAL(10,2),
  latitude   DECIMAL(10,6),
  longitude  DECIMAL(10,6),
  geom       GEOMETRY(Geometry, 4326)
);
CREATE INDEX IF NOT EXISTS idx_geo_parent ON spatial_geo(parent_id);
CREATE INDEX IF NOT EXISTS idx_geo_level ON spatial_geo(level);
CREATE INDEX IF NOT EXISTS idx_geo_geom ON spatial_geo USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_geo_name_trgm ON spatial_geo(name);

-- Make `code` nullable for lower-level features (villages) where codes may not exist
ALTER TABLE IF EXISTS spatial_geo ALTER COLUMN code DROP NOT NULL;

-- 4. indicators
CREATE TABLE IF NOT EXISTS indicators (
  id          SERIAL PRIMARY KEY,
  code        VARCHAR(50) UNIQUE NOT NULL,
  name        VARCHAR(200) NOT NULL,
  description TEXT,
  unit        VARCHAR(50) NOT NULL,
  category    VARCHAR(100) NOT NULL,
  source      VARCHAR(200),
  is_active   BOOLEAN DEFAULT TRUE
);

-- 5. data_values
CREATE TABLE IF NOT EXISTS data_values (
  id            SERIAL PRIMARY KEY,
  geography_id  INTEGER REFERENCES spatial_geo(id) ON DELETE CASCADE,
  indicator_id  INTEGER REFERENCES indicators(id) ON DELETE CASCADE,
  year          INTEGER NOT NULL,
  value         DECIMAL(15,2) NOT NULL,
  gender        VARCHAR(20) DEFAULT 'all',
  age_group     VARCHAR(50) DEFAULT 'all',
  source        VARCHAR(200),
  last_updated  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(geography_id, indicator_id, year, gender, age_group)
);
CREATE INDEX IF NOT EXISTS idx_data_geo ON data_values(geography_id);
CREATE INDEX IF NOT EXISTS idx_data_indicator ON data_values(indicator_id);
CREATE INDEX IF NOT EXISTS idx_data_year ON data_values(year);

-- 6. usage_logs
CREATE TABLE IF NOT EXISTS usage_logs (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER REFERENCES users(id) ON DELETE SET NULL,
  api_key_id       INTEGER REFERENCES api_keys(id) ON DELETE SET NULL,
  endpoint         VARCHAR(255),
  method           VARCHAR(10),
  status_code      INTEGER,
  response_time_ms INTEGER,
  ip_address       INET,
  timestamp        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_usage_user ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_time ON usage_logs(timestamp);

-- 7. audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id         SERIAL PRIMARY KEY,
  admin_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action     VARCHAR(100),
  resource   VARCHAR(255),
  details    TEXT,
  ip_address INET,
  timestamp  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_admin ON audit_logs(admin_id);

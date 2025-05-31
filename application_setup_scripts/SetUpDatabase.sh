#!/usr/bin/env bash
set -euo pipefail

# DB settings
DB_USER="restaurant_user"
DB_PASSWORD="Restaurant1@3"
DB_NAME="restaurant_db"

echo "Creating PostgreSQL role '$DB_USER' and database '$DB_NAME'..."

sudo -u postgres psql <<SQL
-- 1) Create role if not exists
DO \$\$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER'
  ) THEN
    CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASSWORD';
  END IF;
END
\$\$;

-- 2) Create database if not exists
SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
  WHERE NOT EXISTS (
    SELECT FROM pg_database WHERE datname = '$DB_NAME'
  )
\gexec
SQL

echo "✅ Role and database are set up."

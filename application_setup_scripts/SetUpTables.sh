#!/usr/bin/env bash
# run_setup.sh
# This script exports the PostgreSQL superuser (or connecting user) password,
# then runs the setup_schema.sql file against the restaurant_db database.
#
# Usage:
#   export PGPASSWORD="your_db_password"
#   ./run_setup.sh

set -e  # Exit immediately if any command fails

# Database connection parameters – adjust these values as needed.
DB_NAME="restaurant_db"
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="restaurant_user"   # For example, if you already have a superuser or a user that can connect.

# Ensure that the SQL file is readable (usually not needed for read-only file)
chmod +r setup_schema.sql
export PGPASSWORD="Restaurant1@3"
# Execute the SQL script using psql.

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f droptables.sql

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f setup_schema.sql

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f insert.sql

echo "Database schema created successfully in database '$DB_NAME'."

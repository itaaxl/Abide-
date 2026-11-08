#!/usr/bin/env bash
# Applies the Supabase migrations to a throwaway PostgreSQL database (with a
# small Supabase auth shim) and runs the two-user row-level security tests.
#
#   PGHOST=/path/to/socket PGPORT=5432 PGUSER=postgres npm run test:db
set -euo pipefail
DB="abide_rls_test_$$"
cd "$(dirname "$0")/.."
psql -v ON_ERROR_STOP=1 -q -d postgres -c "create database $DB"
trap 'psql -q -d postgres -c "drop database if exists $DB" >/dev/null' EXIT
psql -v ON_ERROR_STOP=1 -q -d "$DB" -f tests/db/supabase-shim.sql
for f in supabase/migrations/*.sql; do
  psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$f"
done
psql -v ON_ERROR_STOP=1 -q -t -A -o /dev/null -d "$DB" -f tests/db/rls.test.sql 2>&1 | sed "s/^psql:[^ ]* NOTICE:  /  /"

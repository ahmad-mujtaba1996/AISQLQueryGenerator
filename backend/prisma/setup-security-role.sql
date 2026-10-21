-- DataPulse AI: Least Privilege PostgreSQL Role Setup for Supabase
-- Run this in your Supabase SQL editor or as a migration script to enforce
-- that AI-generated queries can NEVER modify data or access system tables.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'datapulse_analytics_role') THEN
    CREATE ROLE datapulse_analytics_role WITH LOGIN PASSWORD 'datapulse_secure_analytics_pass_2026' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
END
$$;

-- Grant connection to the target database
GRANT CONNECT ON DATABASE postgres TO datapulse_analytics_role;

-- Allow schema usage
GRANT USAGE ON SCHEMA public TO datapulse_analytics_role;

-- Grant SELECT ONLY on analytics tables
GRANT SELECT ON TABLE public.users TO datapulse_analytics_role;
GRANT SELECT ON TABLE public.products TO datapulse_analytics_role;
GRANT SELECT ON TABLE public.orders TO datapulse_analytics_role;

-- Explicitly revoke all mutation & DDL capabilities
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM datapulse_analytics_role;
REVOKE CREATE ON SCHEMA public FROM datapulse_analytics_role;

-- Enforce read-only transactions & 5s statement timeout at the role level
ALTER ROLE datapulse_analytics_role SET default_transaction_read_only = on;
ALTER ROLE datapulse_analytics_role SET statement_timeout = '5000';

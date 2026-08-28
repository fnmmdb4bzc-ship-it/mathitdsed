-- Runs once, on first Postgres init, before anything else connects.
-- Keycloak gets its own database inside the same server instance.
SELECT 'CREATE DATABASE keycloak'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'keycloak')\gexec

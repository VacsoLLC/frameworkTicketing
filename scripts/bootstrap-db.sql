-- One-time bootstrap for the shared MariaDB RDS instance.
-- Run via the SSH tunnel documented in README.md:
--   mysql -h 127.0.0.1 -u admin -p"$DB_PASS" < scripts/bootstrap-db.sql
--
-- The framework backend auto-creates tables inside these databases at
-- startup, but it does not create the databases themselves.

CREATE DATABASE IF NOT EXISTS core;
CREATE DATABASE IF NOT EXISTS ticketing;

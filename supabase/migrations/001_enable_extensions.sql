-- Enable required extensions for Silo database
-- pgcrypto: provides cryptographic functions including gen_random_bytes for UUID v7

CREATE EXTENSION IF NOT EXISTS pgcrypto;

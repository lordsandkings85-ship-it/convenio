-- =================================================================
-- Adds the Property Status / Carpet Area fields from the public
-- Franchise page's enquiry form to the shared `enquiries` table
-- used by the Franchise Admin Dashboard & AI Chatbot.
-- Run this in Supabase Dashboard -> SQL Editor (after supabase_schema.sql
-- and supabase_update.sql have already been run).
-- =================================================================

ALTER TABLE IF EXISTS public.enquiries
ADD COLUMN IF NOT EXISTS property_status TEXT,
ADD COLUMN IF NOT EXISTS carpet_area TEXT;

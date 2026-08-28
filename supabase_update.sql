-- =================================================================
-- CONVINO AI / CONVENIO MART - SUPABASE DATABASE UPDATE SCRIPT
-- Run this script in your Supabase Dashboard -> SQL Editor
-- =================================================================

-- 1. Ensure 'source' column exists in enquiries table
ALTER TABLE IF EXISTS public.enquiries 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'FORM';

-- 2. Update 'templates' table columns to support subject, status_trigger, and is_system
ALTER TABLE IF EXISTS public.templates 
ADD COLUMN IF NOT EXISTS subject TEXT,
ADD COLUMN IF NOT EXISTS status_trigger TEXT,
ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;

-- 3. Ensure foreign key cascading deletes are enabled
-- (When a lead is deleted, all timeline, tasks, and drafts automatically clean up)
ALTER TABLE IF EXISTS public.enquiry_timeline
DROP CONSTRAINT IF EXISTS enquiry_timeline_enquiry_id_fkey,
ADD CONSTRAINT enquiry_timeline_enquiry_id_fkey 
    FOREIGN KEY (enquiry_id) REFERENCES public.enquiries(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.communication_drafts
DROP CONSTRAINT IF EXISTS communication_drafts_enquiry_id_fkey,
ADD CONSTRAINT communication_drafts_enquiry_id_fkey 
    FOREIGN KEY (enquiry_id) REFERENCES public.enquiries(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.follow_up_tasks
DROP CONSTRAINT IF EXISTS follow_up_tasks_enquiry_id_fkey,
ADD CONSTRAINT follow_up_tasks_enquiry_id_fkey 
    FOREIGN KEY (enquiry_id) REFERENCES public.enquiries(id) ON DELETE CASCADE;

-- 4. Enable Row Level Security (RLS) & Public Policies for all tables
ALTER TABLE IF EXISTS public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.enquiry_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.communication_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.follow_up_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.templates ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public full access on enquiries') THEN
        CREATE POLICY "Allow public full access on enquiries" ON public.enquiries FOR ALL TO public USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public full access on timeline') THEN
        CREATE POLICY "Allow public full access on timeline" ON public.enquiry_timeline FOR ALL TO public USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public full access on drafts') THEN
        CREATE POLICY "Allow public full access on drafts" ON public.communication_drafts FOR ALL TO public USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public full access on tasks') THEN
        CREATE POLICY "Allow public full access on tasks" ON public.follow_up_tasks FOR ALL TO public USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public full access on templates') THEN
        CREATE POLICY "Allow public full access on templates" ON public.templates FOR ALL TO public USING (true);
    END IF;
END $$;

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON public.enquiries(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON public.enquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_enquiry ON public.enquiry_timeline(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_tasks_enquiry ON public.follow_up_tasks(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_drafts_enquiry ON public.communication_drafts(enquiry_id);

-- 6. Enable Realtime Notifications Publication on enquiries
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.enquiries;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Success Confirmation Message
SELECT 'Supabase database schema updated successfully!' AS result;

-- Create Enum for Enquiry Status
CREATE TYPE enquiry_status AS ENUM (
  'NEW', 
  'ASSIGNED', 
  'FIRST_CALL', 
  'INTERESTED', 
  'CALL_LATER', 
  'NO_RESPONSE', 
  'NOT_INTERESTED', 
  'DOCUMENTS_REQUESTED', 
  'DOCUMENTS_RECEIVED', 
  'READY_TO_PAY', 
  'PAYMENT_DETAILS_SENT', 
  'PAYMENT_PENDING', 
  'PAYMENT_RECEIVED', 
  'APPROVED', 
  'ONBOARDING', 
  'OPENED'
);

-- 1. Enquiries Table
CREATE TABLE public.enquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    location TEXT,
    investment_capacity TEXT,
    status enquiry_status DEFAULT 'NEW'::enquiry_status,
    source TEXT DEFAULT 'FORM',
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enquiry Timeline (Activity Log)
CREATE TABLE public.enquiry_timeline (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    enquiry_id UUID REFERENCES public.enquiries(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- e.g., 'STATUS_CHANGE', 'NOTE_ADDED', 'EMAIL_SENT'
    description TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Communication Drafts
CREATE TABLE public.communication_drafts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    enquiry_id UUID REFERENCES public.enquiries(id) ON DELETE CASCADE,
    channel TEXT NOT NULL, -- 'EMAIL' or 'WHATSAPP'
    content TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING_REVIEW', -- 'PENDING_REVIEW', 'APPROVED_SENT', 'REJECTED'
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE
);

-- 4. Follow Up Tasks
CREATE TABLE public.follow_up_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    enquiry_id UUID REFERENCES public.enquiries(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    task_type TEXT NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'COMPLETED', 'MISSED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Templates Table
CREATE TABLE public.templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL, -- 'EMAIL' or 'WHATSAPP'
    name TEXT NOT NULL,
    subject TEXT,
    body TEXT NOT NULL,
    status_trigger TEXT,
    is_system BOOLEAN DEFAULT false,
    attachment_url TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiry_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Create Policies for Public Access
CREATE POLICY "Allow public full access on enquiries" ON public.enquiries FOR ALL TO public USING (true);
CREATE POLICY "Allow public full access on timeline" ON public.enquiry_timeline FOR ALL TO public USING (true);
CREATE POLICY "Allow public full access on drafts" ON public.communication_drafts FOR ALL TO public USING (true);
CREATE POLICY "Allow public full access on tasks" ON public.follow_up_tasks FOR ALL TO public USING (true);
CREATE POLICY "Allow public full access on templates" ON public.templates FOR ALL TO public USING (true);

-- Function to automatically update the 'updated_at' column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for enquiries updated_at
CREATE TRIGGER update_enquiries_modtime
    BEFORE UPDATE ON public.enquiries
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON public.enquiries(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON public.enquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_enquiry ON public.enquiry_timeline(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_tasks_enquiry ON public.follow_up_tasks(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_drafts_enquiry ON public.communication_drafts(enquiry_id);

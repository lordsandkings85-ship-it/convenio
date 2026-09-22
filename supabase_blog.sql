-- Ensure the updated_at helper function exists (already defined by supabase_schema.sql in some setups)
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Blog Posts Table
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT,
    content TEXT NOT NULL, -- Markdown content
    cover_image TEXT,
    author TEXT,
    status TEXT DEFAULT 'DRAFT', -- 'DRAFT' or 'PUBLISHED'
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Create Policies for Public Access (idempotent: drop before re-create so this file
-- can be re-run safely)
DROP POLICY IF EXISTS "Allow public full access on blog posts" ON public.blog_posts;
CREATE POLICY "Allow public full access on blog posts" ON public.blog_posts FOR ALL TO public USING (true);

-- Trigger for blog_posts updated_at
DROP TRIGGER IF EXISTS update_blog_posts_modtime ON public.blog_posts;
CREATE TRIGGER update_blog_posts_modtime
    BEFORE UPDATE ON public.blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON public.blog_posts(created_at DESC);

-- Blog Image Storage Bucket
-- Public bucket where cover images and inline article images are uploaded from the CMS.
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to blog images
DROP POLICY IF EXISTS "Public read access to blog images" ON storage.objects;
CREATE POLICY "Public read access to blog images" ON storage.objects
    FOR SELECT TO public USING (bucket_id = 'blog-images');

-- Allow uploads from the anon key (used by the CMS) by granting the same
-- public access that the app already uses for the blog_posts table.
DROP POLICY IF EXISTS "Public upload access to blog images" ON storage.objects;
CREATE POLICY "Public upload access to blog images" ON storage.objects
    FOR INSERT TO public WITH CHECK (bucket_id = 'blog-images');

DROP POLICY IF EXISTS "Public update access to blog images" ON storage.objects;
CREATE POLICY "Public update access to blog images" ON storage.objects
    FOR UPDATE TO public USING (bucket_id = 'blog-images');

DROP POLICY IF EXISTS "Public delete access to blog images" ON storage.objects;
CREATE POLICY "Public delete access to blog images" ON storage.objects
    FOR DELETE TO public USING (bucket_id = 'blog-images');
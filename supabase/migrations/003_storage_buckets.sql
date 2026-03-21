-- Migration: Create storage buckets for image uploads
-- Creates wine-images and event-images buckets with public read access
-- and admin-only upload/delete policies.

-- Create buckets (idempotent — will skip if already exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('wine-images', 'wine-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access for wine-images
CREATE POLICY "Public read wine images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'wine-images');

-- Admin-only upload for wine-images
CREATE POLICY "Admin upload wine images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'wine-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin-only delete for wine-images
CREATE POLICY "Admin delete wine images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'wine-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Public read access for event-images
CREATE POLICY "Public read event images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-images');

-- Admin-only upload for event-images
CREATE POLICY "Admin upload event images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'event-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin-only delete for event-images
CREATE POLICY "Admin delete event images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'event-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create storage bucket for application documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('application-documents', 'application-documents', false);

-- Allow anyone to upload files (no auth required for applications)
CREATE POLICY "Allow public uploads"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'application-documents');

-- Allow reading files for processing (service role will handle this)
CREATE POLICY "Allow public read for processing"
ON storage.objects
FOR SELECT
USING (bucket_id = 'application-documents');
-- Allow service role to insert into applications table
CREATE POLICY "Allow service role to insert applications"
ON public.applications FOR INSERT TO service_role
WITH CHECK (true);
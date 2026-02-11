
-- The INSERT policies with true are intentional for public candidate submission.
-- But let's add anon role access for the public submission form
-- and tighten candidate insert to require at least basic data validation via the app.

-- Allow anonymous/public reads of nothing (candidates are protected)
-- No changes needed - the current policies are correct for the use case:
-- Public form submits candidates (INSERT true), only HR/Admin can read/update/delete.

-- Just ensure anon can upload to storage for the public form
CREATE POLICY "Anon can upload to candidate-documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'candidate-documents' AND auth.role() = 'anon');

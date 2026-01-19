/*
  # Create Feedback Screenshots Storage Bucket

  1. Storage
    - Creates `feedback-screenshots` bucket for storing user-uploaded screenshots
    - Enables public access for viewing screenshots
    - Restricts uploads to authenticated users
    - Limits file size and types
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feedback-screenshots',
  'feedback-screenshots',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

CREATE POLICY "Authenticated users can upload feedback screenshots"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'feedback-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view feedback screenshots"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'feedback-screenshots');

CREATE POLICY "Users can delete their own feedback screenshots"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'feedback-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

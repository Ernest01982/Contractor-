-- Create Clients Table (in case it wasn't created yet)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  vat_number TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- ADD missing columns to the existing Quotes table
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_phone TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_vat_number TEXT;

-- Add missing DELETE policy for quotes to allow the new Delete Quote button to work
DROP POLICY IF EXISTS "Allow public delete to quotes" ON quotes;
CREATE POLICY "Allow public delete to quotes" ON quotes FOR DELETE USING (true);

-- Reload the Supabase PostgREST schema cache just to be safe
NOTIFY pgrst, 'reload schema';

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

-- 2. Add missing CRM columns to the existing Quotes table
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_phone TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_vat_number TEXT;

-- 3. Add missing DELETE policy for quotes
DROP POLICY IF EXISTS "Allow public delete to quotes" ON quotes;
CREATE POLICY "Allow public delete to quotes" ON quotes FOR DELETE USING (true);

-- 4. Reload the Supabase PostgREST schema cache
NOTIFY pgrst, 'reload schema';

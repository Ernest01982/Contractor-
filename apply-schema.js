const token = 'sbp_fbda0122a684fffd68c61125d4287f3b5b9cf454';
const ref = 'psyzfnepaqtzlxjdulva';

const sql = `
-- 1. Ensure Clients Table exists
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  vat_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add missing columns to existing Quotes table
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_phone TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_vat_number TEXT;

-- 3. Ensure Quote Items Table exists
CREATE TABLE IF NOT EXISTS quote_items (
  id UUID PRIMARY KEY,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  job_type TEXT,
  surface_type TEXT,
  description TEXT,
  length NUMERIC,
  width NUMERIC,
  height NUMERIC,
  sqm NUMERIC,
  rate NUMERIC,
  quantity NUMERIC,
  unit_price NUMERIC,
  subtotal NUMERIC
);

-- 4. Set up Policies
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

-- Clients Policies
DROP POLICY IF EXISTS "Allow public read access to clients" ON clients;
CREATE POLICY "Allow public read access to clients" ON clients FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert to clients" ON clients;
CREATE POLICY "Allow public insert to clients" ON clients FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update to clients" ON clients;
CREATE POLICY "Allow public update to clients" ON clients FOR UPDATE USING (true);

-- Quotes Policies
DROP POLICY IF EXISTS "Allow public read access to quotes" ON quotes;
CREATE POLICY "Allow public read access to quotes" ON quotes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert to quotes" ON quotes;
CREATE POLICY "Allow public insert to quotes" ON quotes FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update to quotes" ON quotes;
CREATE POLICY "Allow public update to quotes" ON quotes FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete to quotes" ON quotes;
CREATE POLICY "Allow public delete to quotes" ON quotes FOR DELETE USING (true);

-- Quote Items Policies
DROP POLICY IF EXISTS "Allow public read access to quote_items" ON quote_items;
CREATE POLICY "Allow public read access to quote_items" ON quote_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert to quote_items" ON quote_items;
CREATE POLICY "Allow public insert to quote_items" ON quote_items FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update to quote_items" ON quote_items;
CREATE POLICY "Allow public update to quote_items" ON quote_items FOR UPDATE USING (true);

-- 5. Reload Schema
NOTIFY pgrst, 'reload schema';
`;

async function run() {
  console.log('Starting migration for project:', ref);
  const url = 'https://api.supabase.com/v1/projects/' + ref + '/query';
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    });

    const data = await response.json();
    console.log('Status Code:', response.status);
    if (response.status !== 201 && response.status !== 200) {
      console.error('Migration failed:', JSON.stringify(data, null, 2));
    } else {
      console.log('Migration successful!');
    }
  } catch (e) {
    console.error('Error running migration:', e);
  }
}

run();

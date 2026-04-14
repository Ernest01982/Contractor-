import fs from 'fs';

const token = 'sbp_36fb401ff06ac3c5ececeee31f50c7a72676964f';
const ref = 'psyzfnepaqtzlxjdulva';

const sql = `
-- Create Quotes Table
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  subtotal NUMERIC,
  has_vat BOOLEAN,
  vat_amount NUMERIC,
  total_amount NUMERIC,
  deposit_percentage NUMERIC,
  deposit_amount NUMERIC,
  status TEXT,
  date TIMESTAMPTZ
);

-- Create Quote Items Table
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

-- Create Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  store_name TEXT,
  date TIMESTAMPTZ,
  total_amount NUMERIC,
  vat_amount NUMERIC,
  image_url TEXT
);

-- Enable RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Quotes
DROP POLICY IF EXISTS "Allow public read access to quotes" ON quotes;
CREATE POLICY "Allow public read access to quotes" ON quotes FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow public insert to quotes" ON quotes;
CREATE POLICY "Allow public insert to quotes" ON quotes FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update to quotes" ON quotes;
CREATE POLICY "Allow public update to quotes" ON quotes FOR UPDATE TO anon USING (true);

-- RLS Policies for Quote Items
DROP POLICY IF EXISTS "Allow public read access to quote_items" ON quote_items;
CREATE POLICY "Allow public read access to quote_items" ON quote_items FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow public insert to quote_items" ON quote_items;
CREATE POLICY "Allow public insert to quote_items" ON quote_items FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update to quote_items" ON quote_items;
CREATE POLICY "Allow public update to quote_items" ON quote_items FOR UPDATE TO anon USING (true);

-- RLS Policies for Expenses
DROP POLICY IF EXISTS "Allow public read access to expenses" ON expenses;
CREATE POLICY "Allow public read access to expenses" ON expenses FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow public insert to expenses" ON expenses;
CREATE POLICY "Allow public insert to expenses" ON expenses FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update to expenses" ON expenses;
CREATE POLICY "Allow public update to expenses" ON expenses FOR UPDATE TO anon USING (true);
`;

async function run() {
  try {
    const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }
}

run();

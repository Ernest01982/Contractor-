import fs from 'fs';

const token = 'sbp_36fb401ff06ac3c5ececeee31f50c7a72676964f';
const ref = 'psyzfnepaqtzlxjdulva';

const sql = `
-- Create Clients Table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  vat_number TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Create Quotes Table
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  client_vat_number TEXT,
  subtotal NUMERIC,
  has_vat BOOLEAN,
  vat_amount NUMERIC,
  total_amount NUMERIC,
  deposit_percentage NUMERIC,
  deposit_amount NUMERIC,
  status TEXT,
  date TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
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
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Clients
DROP POLICY IF EXISTS "Allow public read access to clients" ON clients;
CREATE POLICY "Allow public read access to clients" ON clients FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert to clients" ON clients;
CREATE POLICY "Allow public insert to clients" ON clients FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update to clients" ON clients;
CREATE POLICY "Allow public update to clients" ON clients FOR UPDATE USING (true);

-- RLS Policies for Quotes
DROP POLICY IF EXISTS "Allow public read access to quotes" ON quotes;
CREATE POLICY "Allow public read access to quotes" ON quotes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert to quotes" ON quotes;
CREATE POLICY "Allow public insert to quotes" ON quotes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update to quotes" ON quotes;
CREATE POLICY "Allow public update to quotes" ON quotes FOR UPDATE USING (true);

-- RLS Policies for Quote Items
DROP POLICY IF EXISTS "Allow public read access to quote_items" ON quote_items;
CREATE POLICY "Allow public read access to quote_items" ON quote_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert to quote_items" ON quote_items;
CREATE POLICY "Allow public insert to quote_items" ON quote_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update to quote_items" ON quote_items;
CREATE POLICY "Allow public update to quote_items" ON quote_items FOR UPDATE USING (true);

-- RLS Policies for Expenses
DROP POLICY IF EXISTS "Allow public read access to expenses" ON expenses;
CREATE POLICY "Allow public read access to expenses" ON expenses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert to expenses" ON expenses;
CREATE POLICY "Allow public insert to expenses" ON expenses FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update to expenses" ON expenses;
CREATE POLICY "Allow public update to expenses" ON expenses FOR UPDATE USING (true);
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

const token = 'sbp_36fb401ff06ac3c5ececeee31f50c7a72676964f';
const ref = 'psyzfnepaqtzlxjdulva';

const sql = `
-- 1. Add missing updated_at column to expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- 2. Add missing DELETE policy for quote_items so we can remove orphan items
DROP POLICY IF EXISTS "Allow public delete to quote_items" ON quote_items;
CREATE POLICY "Allow public delete to quote_items" ON quote_items FOR DELETE USING (true);

-- 3. Reload the Supabase PostgREST schema cache
NOTIFY pgrst, 'reload schema';
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

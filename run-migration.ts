// Temporary script to execute migration
const token = 'sbp_fbda0122a684fffd68c61125d4287f3b5b9cf454';
const ref = 'psyzfnepaqtzlxjdulva';

const sql = `
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
`;

async function run() {
  try {
    const response = await fetch(\`https://api.supabase.com/v1/projects/\${ref}/query\`, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${token}\`,
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

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.trim().startsWith(`${name}=`)) {
      return line.split('=')[1].trim().replace(/['"]/g, '');
    }
  }
  return null;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseKey = getEnvVar('VITE_SUPABASE_PUBLISHABLE_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('--- EMISSOES ---');
  const { data: eData } = await supabase.from('emissoes').select('*').limit(1);
  if (eData && eData.length > 0) console.log(Object.keys(eData[0]).join(', '));

  console.log('\n--- LOG_RETORNO ---');
  const { data: rData } = await supabase.from('log_retorno').select('*').limit(1);
  if (rData && rData.length > 0) console.log(Object.keys(rData[0]).join(', '));
}

checkSchema();

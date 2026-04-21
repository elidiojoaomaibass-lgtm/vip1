import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ENV_FILE = join(__dirname, '..', '.env.local');
const envContent = readFileSync(ENV_FILE, 'utf-8');
const lines = envContent.split('\n');
const config = {};
lines.forEach(line => {
    const [key, ...value] = line.trim().split('=');
    if (key && value.length) config[key.trim()] = value.join('=').trim();
});

const supabase = createClient(config.VITE_SUPABASE_URL, config.VITE_SUPABASE_ANON_KEY);

async function checkUser() {
    const { data, error } = await supabase
        .from('login_attempts')
        .select('email, created_at')
        .eq('email', 'kingleakds@gmail.com')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao buscar tentativas de login:', error.message);
    } else {
        console.log('Tentativas de login para kingleakds@gmail.com:', data);
    }
}

checkUser();

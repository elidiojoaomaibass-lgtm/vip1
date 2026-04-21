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

async function initDb() {
    console.log('🚀 Inicializando registros básicos...');

    const promos = [
        { id: 'top', title: '', description: '', button_text: '', button_link: '', is_active: false },
        { id: 'bottom', title: '', description: '', button_text: '', button_link: '', is_active: false }
    ];

    for (const promo of promos) {
        const { error } = await supabase
            .from('promos')
            .upsert(promo, { onConflict: 'id' });

        if (error) {
            console.error(`❌ Erro ao inicializar promo ${promo.id}:`, error.message);
        } else {
            console.log(`✅ Promo ${promo.id} inicializada.`);
        }
    }
}

initDb();

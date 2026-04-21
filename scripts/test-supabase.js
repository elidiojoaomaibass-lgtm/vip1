// Teste de Conexão com Supabase
// Execute: node scripts/test-supabase.js

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('\n🔍 HOTHUB - Teste de Conexão Supabase\n');
console.log('═══════════════════════════════════════════════════\n');

// Ler .env.local
const ENV_FILE = join(__dirname, '..', '.env.local');
const envContent = readFileSync(ENV_FILE, 'utf-8');
const lines = envContent.split('\n');

const config = {};
lines.forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=');
    if (key && value) {
      config[key.trim()] = value.trim();
    }
  }
});

const SUPABASE_URL = config.SUPABASE_URL || config.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY || config.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.log('❌ Variáveis do Supabase não configuradas!\n');
  process.exit(1);
}

console.log('📋 Credenciais Detectadas:\n');
console.log(`   URL: ${SUPABASE_URL}`);
console.log(`   KEY: ${SUPABASE_ANON_KEY.substring(0, 20)}...\n`);

console.log('═══════════════════════════════════════════════════\n');
console.log('🔌 Testando conexão...\n');

try {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Teste 1: Listar tabelas
  console.log('📊 Teste 1: Verificando tabelas...');
  
  const tests = [
    { name: 'banners', table: 'banners' },
    { name: 'videos', table: 'videos' },
    { name: 'promos', table: 'promos' },
    { name: 'notices', table: 'notices' }
  ];
  
  let allPassed = true;
  
  for (const test of tests) {
    try {
      const { data, error } = await supabase.from(test.table).select('*').limit(1);
      
      if (error) {
        console.log(`   ❌ ${test.name}: ${error.message}`);
        allPassed = false;
      } else {
        console.log(`   ✅ ${test.name}: Conectado (${data ? data.length : 0} registros)`);
      }
    } catch (err) {
      console.log(`   ❌ ${test.name}: ${err.message}`);
      allPassed = false;
    }
  }
  
  console.log('\n═══════════════════════════════════════════════════\n');
  
  if (allPassed) {
    console.log('✅ SUCESSO: Supabase conectado e funcionando perfeitamente!\n');
    console.log('🎉 Todas as tabelas estão acessíveis.\n');
    console.log('💡 Próximos passos:');
    console.log('   1. Acesse o Admin Dashboard');
    console.log('   2. Adicione alguns dados');
    console.log('   3. Verifique no Supabase Table Editor\n');
  } else {
    console.log('⚠️  AVISO: Algumas tabelas não estão acessíveis.\n');
    console.log('💡 Possíveis causas:');
    console.log('   1. Tabelas não foram criadas (execute os SQLs do SETUP_SUPABASE.md)');
    console.log('   2. Políticas RLS não configuradas');
    console.log('   3. Projeto Supabase ainda inicializando\n');
  }
  
} catch (error) {
  console.log('❌ ERRO ao conectar:\n');
  console.log(`   ${error.message}\n`);
  console.log('💡 Verifique:');
  console.log('   1. SUPABASE_URL está correto');
  console.log('   2. SUPABASE_ANON_KEY está correto');
  console.log('   3. Projeto Supabase está ativo\n');
  process.exit(1);
}

console.log('═══════════════════════════════════════════════════\n');

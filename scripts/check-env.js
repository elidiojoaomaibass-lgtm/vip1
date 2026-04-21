// Validador de Configuração do Ambiente
// Execute com: node scripts/check-env.js

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ENV_FILE = join(__dirname, '..', '.env.local');

console.log('\n🔍 HOTHUB - Validador de Configuração\n');
console.log('═══════════════════════════════════════════════════\n');

// Verificar se .env.local existe
if (!existsSync(ENV_FILE)) {
  console.log('❌ Arquivo .env.local não encontrado!\n');
  console.log('💡 Solução: Copie o arquivo .env.example para .env.local\n');
  console.log('   Comando: cp .env.example .env.local\n');
  process.exit(1);
}

// Ler arquivo .env.local
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

// Validações
let hasErrors = false;
let hasWarnings = false;

console.log('📋 Variáveis de Ambiente Detectadas:\n');

// GEMINI_API_KEY
if (!config.GEMINI_API_KEY) {
  console.log('⚠️  GEMINI_API_KEY: Não configurada');
  hasWarnings = true;
} else if (config.GEMINI_API_KEY === 'PLACEHOLDER_API_KEY' || config.GEMINI_API_KEY.includes('placeholder')) {
  console.log('⚠️  GEMINI_API_KEY: Placeholder detectado (funcionalidades de IA não funcionarão)');
  hasWarnings = true;
} else {
  console.log('✅ GEMINI_API_KEY: Configurada');
}

// SUPABASE_URL
const SUPABASE_URL = config.VITE_SUPABASE_URL || config.SUPABASE_URL;
if (!SUPABASE_URL) {
  console.log('ℹ️  SUPABASE_URL: Não configurada (usando localStorage como fallback)');
} else if (SUPABASE_URL.includes('your-project') || !SUPABASE_URL.includes('supabase.co')) {
  console.log('⚠️  SUPABASE_URL: Formato inválido (deve ser https://seu-projeto.supabase.co)');
  hasWarnings = true;
} else {
  console.log('✅ SUPABASE_URL: Configurada');
}

// SUPABASE_ANON_KEY
const SUPABASE_ANON_KEY = config.VITE_SUPABASE_ANON_KEY || config.SUPABASE_ANON_KEY;
if (!SUPABASE_ANON_KEY) {
  console.log('ℹ️  SUPABASE_ANON_KEY: Não configurada (usando localStorage como fallback)');
} else if (SUPABASE_ANON_KEY.includes('your-anon-key') || SUPABASE_ANON_KEY.length < 100) {
  console.log('⚠️  SUPABASE_ANON_KEY: Formato inválido (chave muito curta ou placeholder)');
  hasWarnings = true;
} else {
  console.log('✅ SUPABASE_ANON_KEY: Configurada');
}

console.log('\n═══════════════════════════════════════════════════\n');

// Validação de Supabase
const hasSupabaseUrl = SUPABASE_URL && !SUPABASE_URL.includes('your-project');
const hasSupabaseKey = SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes('your-anon-key');

if (hasSupabaseUrl && hasSupabaseKey) {
  console.log('🗄️  Modo: SUPABASE (Dados sincronizados na nuvem)');
} else if (!hasSupabaseUrl && !hasSupabaseKey) {
  console.log('💾 Modo: LOCALSTORAGE (Dados salvos apenas no navegador)');
} else {
  console.log('⚠️  Modo: INCOMPLETO (Configure ambas as variáveis do Supabase ou deixe ambas vazias)');
  hasWarnings = true;
}

console.log('\n═══════════════════════════════════════════════════\n');

// Resultado Final
if (hasErrors) {
  console.log('❌ ERRO: Configuração inválida! Corrija os erros acima.\n');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  AVISO: Configuração com avisos. O sistema funcionará, mas com limitações.\n');
  console.log('💡 Dica: Consulte o SETUP_SUPABASE.md para configurar corretamente.\n');
} else {
  console.log('✅ SUCESSO: Configuração válida! Sistema pronto para uso.\n');
}

console.log('═══════════════════════════════════════════════════\n');

// Próximos passos
if (!hasSupabaseUrl || !hasSupabaseKey) {
  console.log('📚 Próximos Passos (Opcional):\n');
  console.log('   1. Leia o guia: SETUP_SUPABASE.md');
  console.log('   2. Crie um projeto no Supabase: https://supabase.com');
  console.log('   3. Configure as variáveis no .env.local');
  console.log('   4. Reinicie o servidor: npm run dev\n');
}

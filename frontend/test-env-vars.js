// Teste simples para verificar arquivo .env.local
import * as fs from 'fs';
import path from 'path';

console.log('=== VERIFICAÇÃO DO ARQUIVO .env.local ===');

const envPath = path.join(__dirname, '.env.local');

if (fs.existsSync(envPath)) {
  console.log('✅ Arquivo .env.local encontrado');
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Verificar se contém as variáveis importantes
  const hasNextAuthUrl = envContent.includes('NEXTAUTH_URL=');
  const hasNextAuthSecret = envContent.includes('NEXTAUTH_SECRET=');
  const hasSupabaseUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL=');
  const hasSupabaseKey = envContent.includes('SUPABASE_SERVICE_ROLE_KEY=');
  
  console.log('NEXTAUTH_URL presente:', hasNextAuthUrl ? '✅' : '❌');
  console.log('NEXTAUTH_SECRET presente:', hasNextAuthSecret ? '✅' : '❌');
  console.log('SUPABASE_URL presente:', hasSupabaseUrl ? '✅' : '❌');
  console.log('SUPABASE_KEY presente:', hasSupabaseKey ? '✅' : '❌');
  
  // Extrair valor do NEXTAUTH_SECRET para verificar tamanho
  const secretMatch = envContent.match(/NEXTAUTH_SECRET=(.+)/);
  if (secretMatch) {
    const secretValue = secretMatch[1].trim();
    console.log('NEXTAUTH_SECRET tem', secretValue.length, 'caracteres');
    if (secretValue.length < 32) {
      console.log('⚠️  AVISO: NEXTAUTH_SECRET deve ter pelo menos 32 caracteres');
    }
  }
  
} else {
  console.log('❌ Arquivo .env.local não encontrado!');
}

console.log('=========================================');
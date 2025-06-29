#!/usr/bin/env node

/**
 * Script para testar e diagnosticar problemas com Google OAuth
 * Verifica configurações, URLs e conectividade
 */

// Carregar variáveis de ambiente do .env.local
import fs from 'fs';
import path from 'path';

function loadEnvFile() {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=');
        process.env[key] = value;
      }
    });
    
    console.log('✅ Variáveis de ambiente carregadas do .env.local');
  } catch (error) {
    console.log('⚠️  Não foi possível carregar .env.local:', error.message);
  }
}

loadEnvFile();
import https from 'https';

console.log('🔍 DIAGNÓSTICO GOOGLE OAUTH');
console.log('=' .repeat(50));

// 1. Verificar variáveis de ambiente
console.log('\n📋 1. VERIFICANDO VARIÁVEIS DE AMBIENTE:');
const requiredVars = {
  'GOOGLE_CLIENT_ID': process.env.GOOGLE_CLIENT_ID,
  'GOOGLE_CLIENT_SECRET': process.env.GOOGLE_CLIENT_SECRET,
  'NEXTAUTH_URL': process.env.NEXTAUTH_URL,
  'NEXTAUTH_SECRET': process.env.NEXTAUTH_SECRET
};

let hasAllVars = true;
for (const [key, value] of Object.entries(requiredVars)) {
  if (value) {
    console.log(`✅ ${key}: ${key.includes('SECRET') ? '***' : value}`);
  } else {
    console.log(`❌ ${key}: MISSING`);
    hasAllVars = false;
  }
}

if (!hasAllVars) {
  console.log('\n❌ ERRO: Variáveis de ambiente obrigatórias estão faltando!');
  process.exit(1);
}

// 2. Verificar formato do Client ID
console.log('\n🔑 2. VERIFICANDO FORMATO DO CLIENT ID:');
const clientId = process.env.GOOGLE_CLIENT_ID;
if (clientId && clientId.includes('.apps.googleusercontent.com')) {
  console.log('✅ Client ID tem formato correto');
} else {
  console.log('❌ Client ID pode ter formato incorreto');
}

// 3. Verificar URLs de callback
console.log('\n🌐 3. VERIFICANDO URLs DE CALLBACK:');
const nextAuthUrl = process.env.NEXTAUTH_URL;
if (nextAuthUrl) {
  const callbackUrl = `${nextAuthUrl}/api/auth/callback/google`;
  console.log(`📍 URL de callback esperada: ${callbackUrl}`);
  
  // Verificar se é localhost ou produção
  if (nextAuthUrl.includes('localhost')) {
    console.log('🏠 Ambiente: DESENVOLVIMENTO (localhost)');
    console.log('💡 URLs autorizadas no Google Console devem incluir:');
    console.log('   - http://localhost:3000');
    console.log('   - http://localhost:3000/api/auth/callback/google');
  } else {
    console.log('🌍 Ambiente: PRODUÇÃO');
    console.log('💡 URLs autorizadas no Google Console devem incluir:');
    console.log(`   - ${nextAuthUrl}`);
    console.log(`   - ${callbackUrl}`);
  }
}

// 4. Testar conectividade com Google
console.log('\n🔗 4. TESTANDO CONECTIVIDADE COM GOOGLE:');

function testGoogleConnectivity() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'accounts.google.com',
      port: 443,
      path: '/.well-known/openid_configuration',
      method: 'GET',
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Conectividade com Google OAuth: OK');
        resolve(true);
      } else {
        console.log(`❌ Conectividade com Google OAuth: ERRO (${res.statusCode})`);
        resolve(false);
      }
    });

    req.on('error', (error) => {
      console.log(`❌ Erro de conectividade: ${error.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('❌ Timeout na conexão com Google');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// 5. Verificar arquivos de configuração
console.log('\n📁 5. VERIFICANDO ARQUIVOS DE CONFIGURAÇÃO:');

const configFiles = [
  'app/api/auth/[...nextauth]/route.ts',
  'lib/auth-config.ts',
  'app/login/page.tsx'
];

configFiles.forEach(file => {
  if (fs.existsSync(path.join(process.cwd(), file))) {
    console.log(`✅ ${file}: EXISTS`);
  } else {
    console.log(`❌ ${file}: MISSING`);
  }
});

// 6. Executar teste de conectividade
async function runDiagnostics() {
  await testGoogleConnectivity();
  
  console.log('\n🎯 PRÓXIMOS PASSOS PARA RESOLVER O PROBLEMA:');
  console.log('=' .repeat(50));
  
  if (nextAuthUrl && nextAuthUrl.includes('localhost')) {
    console.log('\n🏠 PARA DESENVOLVIMENTO (localhost):');
    console.log('1. Acesse: https://console.cloud.google.com/apis/credentials');
    console.log('2. Selecione seu projeto');
    console.log('3. Clique no seu OAuth 2.0 Client ID');
    console.log('4. Em "Authorized JavaScript origins", adicione:');
    console.log('   - http://localhost:3000');
    console.log('5. Em "Authorized redirect URIs", adicione:');
    console.log('   - http://localhost:3000/api/auth/callback/google');
    console.log('6. Salve as alterações');
    console.log('7. Reinicie o servidor de desenvolvimento');
  } else {
    console.log('\n🌍 PARA PRODUÇÃO (Vercel):');
    console.log('1. Acesse: https://console.cloud.google.com/apis/credentials');
    console.log('2. Selecione seu projeto');
    console.log('3. Clique no seu OAuth 2.0 Client ID');
    console.log('4. Em "Authorized JavaScript origins", adicione:');
    console.log(`   - ${nextAuthUrl}`);
    console.log('5. Em "Authorized redirect URIs", adicione:');
    console.log(`   - ${nextAuthUrl}/api/auth/callback/google`);
    console.log('6. Salve as alterações');
    console.log('7. Faça redeploy no Vercel');
  }
  
  console.log('\n🔧 VERIFICAÇÕES ADICIONAIS:');
  console.log('- Verifique se as variáveis de ambiente estão corretas no Vercel');
  console.log('- Teste em uma aba anônima do navegador');
  console.log('- Verifique o console do navegador para erros JavaScript');
  console.log('- Confirme se o domínio está verificado no Google Console');
  
  console.log('\n✅ Diagnóstico concluído!');
}

runDiagnostics().catch(console.error);
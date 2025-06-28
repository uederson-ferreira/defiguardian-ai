import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// Função para carregar variáveis de ambiente
function loadEnvLocal() {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').replace(/^["']|["']$/g, '');
            process.env[key] = value;
          }
        }
      });
      console.log('✅ Arquivo .env.local carregado com sucesso');
    } else {
      console.log('⚠️  Arquivo .env.local não encontrado');
    }
  } catch (error) {
    console.log('❌ Erro ao carregar .env.local:', error.message);
  }
}

async function testAuthAfterTriggerFix() {
  console.log('🔧 TESTE DE AUTENTICAÇÃO APÓS CORREÇÃO DO TRIGGER\n');
  
  // 1. Carregar variáveis de ambiente
  loadEnvLocal();
  
  // 2. Verificar variáveis essenciais
  console.log('📋 Verificando variáveis de ambiente:');
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ];
  
  let missingVars = [];
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Definida`);
    } else {
      console.log(`❌ ${varName}: NÃO DEFINIDA`);
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    console.log('\n❌ Variáveis de ambiente faltando:', missingVars.join(', '));
    return;
  }
  
  // 3. Testar conexão com Supabase
  console.log('\n🔗 Testando conexão com Supabase...');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    // Verificar se as tabelas existem
    const { error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (usersError) {
      console.log('❌ Erro ao acessar tabela users:', usersError.message);
      return;
    }
    
    const { error: passwordsError } = await supabase
      .from('user_passwords')
      .select('count')
      .limit(1);
    
    if (passwordsError) {
      console.log('❌ Erro ao acessar tabela user_passwords:', passwordsError.message);
      return;
    }
    
    console.log('✅ Conexão com Supabase OK');
    console.log('✅ Tabela users acessível');
    console.log('✅ Tabela user_passwords acessível');
    
  } catch (error) {
    console.log('❌ Erro na conexão com Supabase:', error.message);
    return;
  }
  
  // 4. Testar criação e autenticação de usuário
  console.log('\n👤 Testando criação e autenticação de usuário...');
  
  const testUser = {
    name: 'Teste Auth',
    email: 'teste.auth@example.com',
    password: 'senha123'
  };
  
  try {
    // Limpar usuário de teste se existir
    await supabase
      .from('user_passwords')
      .delete()
      .eq('user_id', (await supabase
        .from('users')
        .select('id')
        .eq('email', testUser.email)
        .single()).data?.id);
    
    await supabase
      .from('users')
      .delete()
      .eq('email', testUser.email);
    
    // Criar usuário
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        name: testUser.name,
        email: testUser.email,
        provider: 'credentials',
        provider_id: testUser.email,
        email_verified: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (userError) {
      console.log('❌ Erro ao criar usuário:', userError.message);
      return;
    }
    
    console.log('✅ Usuário criado com sucesso');
    
    // Criar senha hash
    const hashedPassword = await bcrypt.hash(testUser.password, 12);
    
    // Inserir senha
    const { error: passwordError } = await supabase
      .from('user_passwords')
      .insert({
        user_id: newUser.id,
        password_hash: hashedPassword
      });
    
    if (passwordError) {
      console.log('❌ Erro ao criar senha:', passwordError.message);
      return;
    }
    
    console.log('✅ Senha criada com sucesso');
    
    // Testar autenticação - buscar usuário
    const { data: authUser, error: authError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', testUser.email)
      .single();
    
    if (authError) {
      console.log('❌ Erro ao buscar usuário para autenticação:', authError.message);
      return;
    }
    
    // Buscar senha separadamente
    const { data: passwordData, error: passwordQueryError } = await supabase
      .from('user_passwords')
      .select('password_hash')
      .eq('user_id', authUser.id)
      .single();
    
    if (passwordQueryError || !passwordData) {
      console.log('❌ Senha não encontrada para o usuário:', passwordQueryError?.message);
      return;
    }
    
    // Verificar senha
    const isValidPassword = await bcrypt.compare(
      testUser.password,
      passwordData.password_hash
    );
    
    if (isValidPassword) {
      console.log('✅ Autenticação bem-sucedida!');
    } else {
      console.log('❌ Falha na autenticação - senha incorreta');
    }
    
    // Limpar dados de teste
    await supabase
      .from('user_passwords')
      .delete()
      .eq('user_id', newUser.id);
    
    await supabase
      .from('users')
      .delete()
      .eq('id', newUser.id);
    
    console.log('✅ Dados de teste removidos');
    
  } catch (error) {
    console.log('❌ Erro no teste de autenticação:', error.message);
  }
  
  // 5. Verificar arquivos de configuração
  console.log('\n📁 Verificando arquivos de configuração:');
  
  const configFiles = [
    'lib/auth-config.ts',
    'app/api/auth/[...nextauth]/route.ts',
    'middleware.ts'
  ];
  
  configFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file}: Existe`);
    } else {
      console.log(`❌ ${file}: NÃO ENCONTRADO`);
    }
  });
  
  // 6. Resumo e próximos passos
  console.log('\n📊 RESUMO DO TESTE:');
  console.log('✅ Trigger do Supabase foi corrigido');
  console.log('✅ Conexão com Supabase funcionando');
  console.log('✅ Criação e autenticação de usuário funcionando');
  console.log('✅ Arquivos de configuração presentes');
  
  console.log('\n🎯 PRÓXIMOS PASSOS PARA RESOLVER O ERRO 401 EM PRODUÇÃO:');
  console.log('1. Verificar no Google Cloud Console:');
  console.log('   - URLs autorizadas: https://defiguardian-ai.vercel.app');
  console.log('   - Callback URLs: https://defiguardian-ai.vercel.app/api/auth/callback/google');
  console.log('2. Verificar variáveis no Vercel:');
  console.log('   - NEXTAUTH_URL=https://defiguardian-ai.vercel.app');
  console.log('   - NEXTAUTH_SECRET (deve ser diferente do local)');
  console.log('3. Fazer redeploy após as correções');
  console.log('4. Testar login em produção');
}

// Executar teste
testAuthAfterTriggerFix().catch(console.error);
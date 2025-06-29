// Teste de cadastro via API
// Usando fetch nativo do Node.js (v18+)

async function testSignup() {
  console.log('=== TESTE DE CADASTRO VIA API ===');
  
  const testUser = {
    email: 'teste@exemplo.com',
    password: 'senha123456',
    name: 'Usuário Teste',
    action: 'signup'
  };
  
  try {
    console.log('Enviando requisição de cadastro...');
    
    const response = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });
    
    console.log('Status da resposta:', response.status);
    console.log('Headers da resposta:', Object.fromEntries(response.headers));
    
    const responseText = await response.text();
    console.log('Corpo da resposta:', responseText);
    
    if (response.status === 401) {
      console.log('❌ Erro 401 - Não autorizado');
    } else if (response.status === 200) {
      console.log('✅ Cadastro realizado com sucesso');
    } else {
      console.log('⚠️  Status inesperado:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
  
  console.log('================================');
}

// Aguardar um pouco para o servidor estar pronto
setTimeout(testSignup, 2000);
import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.PAGBANK_TOKEN?.trim();
  const env = process.env.PAGBANK_ENV || 'sandbox';
  
  const baseUrl = env === 'production' 
    ? 'https://api.pagseguro.com' 
    : 'https://sandbox.api.pagseguro.com';

  const results: any = {
    environment: env,
    baseUrl,
    tokenConfigured: !!token,
    tokenPrefix: token ? token.substring(0, 10) + '...' : 'NÃO CONFIGURADO',
    tests: {},
  };

  if (!token) {
    results.error = 'Token não configurado. Adicione PAGBANK_TOKEN nas variáveis de ambiente.';
    return NextResponse.json(results);
  }

  try {
    const response = await fetch(`${baseUrl}/public-keys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'card' }),
    });

    const data = await response.json();
    
    results.tests.publicKey = {
      success: response.ok,
      status: response.status,
      publicKey: data.public_key ? data.public_key.substring(0, 30) + '...' : null,
      message: response.ok ? 'Chave pública obtida com sucesso!' : data.message || data.error,
    };
  } catch (error: any) {
    results.tests.publicKey = {
      success: false,
      error: error.message,
    };
  }

  try {
    const sessionResponse = await fetch(`${baseUrl}/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const sessionData = await sessionResponse.json();
    
    results.tests.session = {
      success: sessionResponse.ok,
      status: sessionResponse.status,
      sessionId: sessionData.id ? sessionData.id.substring(0, 20) + '...' : null,
      message: sessionResponse.ok ? 'Sessão criada com sucesso!' : sessionData.message || sessionData.error,
    };
  } catch (error: any) {
    results.tests.session = {
      success: false,
      error: error.message,
    };
  }

  const allSuccess = results.tests.publicKey?.success && results.tests.session?.success;
  
  results.status = allSuccess ? 'CONECTADO' : 'ERRO';
  results.message = allSuccess 
    ? 'PagBank conectado com sucesso! Pagamentos prontos para produção.' 
    : 'Erro na conexão com PagBank. Verifique as variáveis de ambiente.';

  return NextResponse.json(results);
}
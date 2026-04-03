import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.PAGBANK_TOKEN?.trim();
  const env = process.env.PAGBANK_ENV || 'sandbox';

  if (!token) {
    return NextResponse.json({ 
      error: 'Token não configurado. Configure PAGBANK_TOKEN no arquivo .env.local' 
    }, { status: 500 });
  }

  const baseUrl = env === 'production' 
    ? 'https://api.pagseguro.com' 
    : 'https://sandbox.api.pagseguro.com';

  try {
    const response = await fetch(`${baseUrl}/public-keys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'card',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erro ao criar chave pública:', data);
      return NextResponse.json({ 
        error: 'Erro ao criar chave pública',
        details: data
      }, { status: response.status });
    }

    return NextResponse.json({
      publicKey: data.public_key,
      message: 'Chave pública criada com sucesso! Use esta chave no frontend.'
    });

  } catch (error: any) {
    console.error('Erro na requisição:', error.message);
    return NextResponse.json({ 
      error: 'Erro ao conectar com PagBank',
      details: error.message
    }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';

const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN?.trim();
const PAGBANK_URL = process.env.PAGBANK_ENV === 'production' 
  ? 'https://api.pagseguro.com/sessions'
  : 'https://sandbox.api.pagseguro.com/sessions';

export async function POST() {
  try {
    if (!PAGBANK_TOKEN) {
      throw new Error('Token do PagBank não configurado');
    }

    const response = await fetch(PAGBANK_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAGBANK_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const text = await response.text();
    
    if (!response.ok) {
      console.error('Erro ao gerar sessão:', text);
      throw new Error('Falha ao gerar sessão de pagamento');
    }

    const data = JSON.parse(text);
    
    return NextResponse.json({
      sessionId: data.id,
    });

  } catch (error: any) {
    console.error('[PAGBANK_SESSION][ERROR]', error.message);
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar sessão' },
      { status: 500 }
    );
  }
}

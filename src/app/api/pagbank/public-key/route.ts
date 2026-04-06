import { NextResponse } from 'next/server';

const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN?.trim();
const PAGBANK_BASE = process.env.PAGBANK_ENV === 'production'
  ? 'https://api.pagseguro.com'
  : 'https://sandbox.api.pagseguro.com';

// Chave estática do sandbox — válida apenas no ambiente de testes
const SANDBOX_KEY = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAr+ZqgD892U9/HXsa7XqBZUayPquAfh9xx4iwUbTSUAvTlmiXFQNTp0Bvt/5vK2FhMj39qSv1zi2OuBjvW38q1E374nzx6NNBL5JosV0+SDINTlCG0cmigHuBOyWzYmjgca+mtQu4WczCaApNaSuVqgb8u7Bd9GCOL4YJotvV5+81frlSwQXralhwRzGhj/A57CGPgGKiuPT+AOGmykIGEZsSD9RKkyoKIoc0OS8CPIzdBOtTQCIwrLn2FxI83Clcg55W8gkFSOS6rWNbG5qFZWMll6yl02HtunalHmUlRUL66YeGXdMDC2PuRcmZbGO5a/2tbVppW6mfSWG3NPRpgwIDAQAB';

export async function GET() {
  // Em sandbox, retorna a chave estática conhecida
  if (process.env.PAGBANK_ENV !== 'production') {
    return NextResponse.json({ publicKey: SANDBOX_KEY });
  }

  // Em produção, busca a chave dinamicamente via API do PagBank
  try {
    const res = await fetch(`${PAGBANK_BASE}/public-keys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAGBANK_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'card' }),
    });

    const data = await res.json();

    if (!res.ok || !data.public_key) {
      console.error('[public-key] PagBank retornou erro:', data);
      throw new Error('Chave pública não retornada pelo PagBank');
    }

    console.log('[public-key] Chave de produção obtida com sucesso');
    return NextResponse.json({ publicKey: data.public_key });

  } catch (err: any) {
    console.error('[public-key] Erro ao buscar chave:', err.message);
    return NextResponse.json(
      { error: 'Falha ao obter chave pública do PagBank' },
      { status: 500 }
    );
  }
}
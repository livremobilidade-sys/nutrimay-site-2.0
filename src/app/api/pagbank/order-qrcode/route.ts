import { NextResponse } from 'next/server';

const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN?.trim();
const PAGBANK_BASE = process.env.PAGBANK_ENV === 'production'
  ? 'https://api.pagseguro.com'
  : 'https://sandbox.api.pagseguro.com';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID não informado' }, { status: 400 });
  }

  try {
    const res = await fetch(`${PAGBANK_BASE}/orders/${id}`, {
      headers: {
        'Authorization': `Bearer ${PAGBANK_TOKEN}`,
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    const data = await res.json();
    const qrCode = data.qr_codes?.[0];
    
    if (!qrCode) {
      return NextResponse.json({ error: 'QR Code não disponível' }, { status: 404 });
    }

    return NextResponse.json({
      qrcode: qrCode.links?.find((l: any) => l.rel === 'QRCODE.PNG')?.href,
      text: qrCode.text,
      amount: qrCode.amount?.value,
    });

  } catch (err: any) {
    console.error('[PagBank QR Code]', err.message);
    return NextResponse.json({ error: 'Erro ao buscar QR Code' }, { status: 500 });
  }
}

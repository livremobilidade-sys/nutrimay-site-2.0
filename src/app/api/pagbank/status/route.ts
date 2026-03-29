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
    const res = await fetch(`${PAGBANK_BASE}/checkouts/${id}`, {
      headers: {
        'Authorization': `Bearer ${PAGBANK_TOKEN}`,
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ status: 'PENDING' });
    }

    const data = await res.json();
    // The checkout status comes in the order/charges
    const chargeStatus = data.charges?.[0]?.status || data.status || 'PENDING';

    return NextResponse.json({ status: chargeStatus, data });

  } catch (err: any) {
    console.error('[PagBank Status]', err.message);
    return NextResponse.json({ status: 'PENDING' });
  }
}

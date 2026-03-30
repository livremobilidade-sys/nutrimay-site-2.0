import { NextResponse } from 'next/server';

const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN?.trim();
const PAGBANK_ENV = process.env.PAGBANK_ENV || 'sandbox';
const PAGBANK_URL = PAGBANK_ENV === 'production'
  ? 'https://api.pagseguro.com/checkouts'
  : 'https://sandbox.api.pagseguro.com/checkouts';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://maynutri.com.br';

  // Test payload mínimo
  const payload = {
    reference_id: `DIAG-${Date.now()}`,
    items: [{ reference_id: 'test-001', name: 'Teste Diagnóstico', quantity: 1, unit_amount: 100 }],
    redirect_url: `${baseUrl}/pedido/sucesso`,
    payment_notification_urls: [`${baseUrl}/api/pagbank/webhook`],
  };

  try {
    const response = await fetch(PAGBANK_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAGBANK_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = text; }

    const payLink = (data as { links?: { rel: string; href: string }[] })?.links?.find((l) => l.rel === 'PAY')?.href;

    return NextResponse.json({
      env: PAGBANK_ENV,
      api_url: PAGBANK_URL,
      token_prefix: PAGBANK_TOKEN?.substring(0, 12) + '...',
      http_status: response.status,
      http_ok: response.ok,
      pay_link: payLink || null,
      pay_link_is_sandbox: payLink?.includes('sandbox') ?? null,
      response: data,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';

const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN?.trim();
const PAGBANK_URL = process.env.PAGBANK_ENV === 'production' 
  ? 'https://api.pagseguro.com/orders'
  : 'https://sandbox.api.pagseguro.com/orders';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { testType } = body;

    console.log('--- DIAGNOSTICO PAGBANK ---');
    console.log('Test type:', testType);

    const testPayload: any = {
      reference_id: `DIAG-${Date.now()}`,
      customer: {
        name: 'Teste Cliente',
        email: 'teste@email.com',
        tax_id: '12345678901',
      },
      items: [
        {
          reference_id: 'test-item-1',
          name: 'Item Teste',
          quantity: 1,
          unit_amount: 1000,
        },
      ],
      notification_urls: ['https://maynutri.com.br/api/pagbank/webhook'],
    };

    if (testType === 'PIX') {
      testPayload.charge = {
        amount: {
          value: 1000,
          currency: 'BRL',
        },
        payment_method: {
          type: 'PIX',
          pix: {
            expiration_time: 3600,
          },
        },
      };
    }

    console.log('Test payload:', JSON.stringify(testPayload, null, 2));

    const response = await fetch(PAGBANK_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAGBANK_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    const text = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', text.substring(0, 500));

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }

    return NextResponse.json({
      testType,
      status: response.status,
      response: parsed,
    });

  } catch (error: any) {
    console.error('Diagnostico error:', error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
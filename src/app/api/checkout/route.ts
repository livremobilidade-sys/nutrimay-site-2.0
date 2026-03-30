import { NextResponse } from 'next/server';

const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN?.trim();
const PAGBANK_URL = process.env.PAGBANK_ENV === 'production' 
  ? 'https://api.pagseguro.com/checkouts' 
  : 'https://sandbox.api.pagseguro.com/checkouts';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, thermalBagOption, customer } = body;

    // Build items with strict integers for unit_amount
    const pagbankItems = items.map((item: any) => ({
      reference_id: String(item.id).substring(0, 64),
      name: String(item.name).replace(/[\[\]]/g, '').substring(0, 100),
      quantity: Math.max(1, Math.floor(Number(item.quantity)) || 1),
      unit_amount: Math.floor(Math.round(Number(item.price) * 100))
    }));

    if (thermalBagOption === 'new') {
      pagbankItems.push({
        reference_id: 'bolsa-termica',
        name: 'Bolsa Termica',
        quantity: 1,
        unit_amount: 1000
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://maynutri.com.br';

    const payload: any = {
      reference_id: `ORDER-${Date.now()}`,
      customer_modifiable: true,
      items: pagbankItems,
      payment_methods: [
        { type: "CREDIT_CARD", brands: ["MASTERCARD", "VISA", "ELO", "HIPERCARD", "AMEX"] },
        { type: "DEBIT_CARD",   brands: ["MASTERCARD", "VISA", "ELO"] },
        { type: "PIX" },
        { type: "BOLETO" },
      ],
      redirect_url: `${baseUrl}/pedido/sucesso`,
      return_url:   `${baseUrl}/pedido/sucesso`,
      payment_notification_urls: [`${baseUrl}/api/pagbank/webhook`],
      notification_urls: [`${baseUrl}/api/pagbank/webhook`],
      soft_descriptor: "MAYNUTRI",
    };

    // Adiciona dados do cliente se disponíveis (preenche o formulário do PagBank)
    if (customer) {
      payload.customer = {
        name: customer.name || 'Cliente MayNutri',
        email: customer.email,
        tax_id: customer.cpf?.replace(/\D/g, ''),
        phones: customer.phone ? [{
          country: '55',
          area: customer.phone.replace(/\D/g, '').substring(0, 2),
          number: customer.phone.replace(/\D/g, '').substring(2),
          type: 'MOBILE'
        }] : []
      };
    }

    console.log('--- PAYLOAD ENVIADO AO PAGBANK ---');
    console.log(JSON.stringify(payload, null, 2));

    const response = await fetch(PAGBANK_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAGBANK_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    console.log('--- RESPOSTA BRUTA DO PAGBANK ---');
    console.log(text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Resposta do PagBank não é um JSON válido: ' + text.substring(0, 100));
    }

    if (!response.ok) {
      const message = data.error_messages 
        ? data.error_messages.map((m: any) => `${m.parameter || 'root'}: ${m.description}`).join(' | ') 
        : 'Erro retornado pelo PagBank';
      throw new Error(message);
    }

    const checkoutLink = data.links?.find((l: any) => l.rel === 'PAY')?.href;

    if (!checkoutLink) {
      throw new Error('Link de pagamento (rel: PAY) não encontrado.');
    }

    return NextResponse.json({ url: checkoutLink });

  } catch (error: any) {
    console.error('SERVER ERROR:', error.message);
    return NextResponse.json(
      { error: error.message || 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}

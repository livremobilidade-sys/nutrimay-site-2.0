import { NextResponse } from 'next/server';
import { CheckoutItem, CheckoutCustomer, cleanCpf, formatPhone, validateCheckoutPayload } from '@/lib/checkoutUtils';

const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN?.trim();
const PAGBANK_URL = process.env.PAGBANK_ENV === 'production' 
  ? 'https://api.pagseguro.com/orders'
  : 'https://sandbox.api.pagseguro.com/orders';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      items,
      thermalBagOption,
      customer,
      paymentMethod,
      encryptedCard,
      cardBrand,
      installments = 1,
      cardHolderName,
    }: {
      items: CheckoutItem[];
      thermalBagOption?: 'new' | 'exchange';
      customer?: CheckoutCustomer;
      paymentMethod: 'credit_card' | 'pix';
      encryptedCard?: string;
      cardBrand?: string | null;
      installments?: number;
      cardHolderName?: string;
    } = body;

    validateCheckoutPayload(items, customer);

    if (paymentMethod === 'credit_card' && !encryptedCard) {
      throw new Error('Cartão criptografado é obrigatório para pagamento com cartão');
    }

    const pagbankItems = items.map((item) => ({
      reference_id: String(item.id).substring(0, 64),
      name: String(item.name).replace(/[\[\]]/g, '').substring(0, 100),
      quantity: Math.max(1, Math.floor(Number(item.quantity)) || 1),
      unit_amount: Math.floor(Math.round(Number(item.price) * 100)),
    }));

    if (thermalBagOption === 'new') {
      pagbankItems.push({
        reference_id: 'bolsa-termica',
        name: 'Bolsa Térmica',
        quantity: 1,
        unit_amount: 1000,
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://maynutri.com.br';
    const referenceId = `ORDER-${Date.now()}`;

    const payload: any = {
      reference_id: referenceId,
      customer: {
        name: customer?.name ?? 'Cliente MayNutri',
        email: customer?.email,
        tax_id: cleanCpf(customer?.cpf || ''),
        phones: [
          {
            type: 'MOBILE',
            number: formatPhone(customer?.phone || ''),
          },
        ],
      },
      items: pagbankItems,
      notification_urls: [`${baseUrl}/api/pagbank/webhook`],
      charges: [],
    };

    if (paymentMethod === 'credit_card') {
      if (!encryptedCard) {
        throw new Error('Cartão criptografado é obrigatório para pagamento com cartão');
      }
      
      payload.charges.push({
        type: 'CARD',
        payment_method: {
          type: 'CREDIT_CARD',
          card: {
            encrypted: encryptedCard,
            brand: cardBrand || 'UNKNOWN',
            holder: {
              name: cardHolderName || customer?.name || 'Cliente',
              tax_id: cleanCpf(customer?.cpf || ''),
            },
          },
          installments: installments,
          capture: true,
        },
      });
    } else if (paymentMethod === 'pix') {
      payload.charges.push({
        type: 'PIX',
        payment_method: {
          type: 'PIX',
          pix: {
            expiration_time: 3600,
          },
        },
      });
    }

    console.log('--- PAYLOAD ENVIADO AO PAGBANK (CHARGE) ---');
    console.log(JSON.stringify(payload, null, 2));

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
        : data.message || 'Erro retornado pelo PagBank';
      throw new Error(message);
    }

    const charge = data.charges?.[0];
    let paymentData: any = {
      reference_id: referenceId,
      orderId: data.id,
    };

    if (paymentMethod === 'pix' && charge?.payment_method?.pix) {
      paymentData = {
        ...paymentData,
        pix: {
          qrcode: charge.payment_method.pix.qr_code?.image?.plain,
          text: charge.payment_method.pix.qr_code?.text,
        },
        status: charge.status,
      };
    } else if (paymentMethod === 'credit_card') {
      paymentData = {
        ...paymentData,
        status: charge?.status,
        cardBrand: charge?.payment_method?.card?.brand,
      };
    }

    return NextResponse.json(paymentData);

  } catch (error: any) {
    console.error('[PAGBANK_CHARGE][ERROR]', {
      message: error.message,
      stack: error.stack,
    });
    const status = error.message?.includes('obrigatório') || error.message?.includes('inválido') ? 400 : 500;
    return NextResponse.json(
      { error: error.message || 'Erro interno no servidor' },
      { status }
    );
  }
}

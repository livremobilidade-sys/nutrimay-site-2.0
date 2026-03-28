import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, customer, paymentMethod, pickupPoint } = body;

    console.log('--- SIMULANDO CHECKOUT ---');
    console.log('Cliente:', customer);
    console.log('Itens:', items.length);
    console.log('Método:', paymentMethod);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simple validation logic for simulation
    if (!customer?.email || !customer?.cpf) {
      return NextResponse.json({ error: 'Dados do cliente incompletos' }, { status: 400 });
    }

    if (paymentMethod === 'credit_card') {
      // Simulate real credit card processing
      // In a real scenario, this would be where we call PagBank /orders
      return NextResponse.json({ 
        success: true, 
        message: 'Pagamento aprovado com sucesso!',
        orderId: `SIM-${Date.now()}`
      });
    }

    if (paymentMethod === 'pix') {
      return NextResponse.json({ 
        success: true, 
        pixQrCode: '00020101021226850014BR.GOV.BCB.PIX0114+55119999999995204000053039865802BR5913NUTRIMAY FRUT6009SAO PAULO62070503***6304E2D0',
        pixCopiaECola: '00020101021226850014BR.GOV.BCB.PIX0114+55119999999995204000053039865802BR5913NUTRIMAY FRUT6009SAO PAULO62070503***6304E2D0',
        message: 'Aguardando pagamento do PIX.'
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Pedido recebido!' 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

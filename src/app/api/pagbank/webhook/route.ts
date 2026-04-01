import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    console.log('📦 [PagBank Webhook] Recebido:', JSON.stringify(body, null, 2));

    const { event, charges } = body;

    // Handle order/charge events
    if (charges && charges.length > 0) {
      const charge = charges[0];
      const referenceId = body.reference_id || charge.reference_id || '';
      const status = charge.status; // PAID, DECLINED, CANCELED, etc.
      
      // Get refusal reason if available
      const refusalReason = charge.cancellation_reason || charge.reject_reason || charge.payment_method?.card?.brand?.errors?.[0]?.message || null;

      console.log(`🔔 [Webhook] Evento: ${event} | Pedido: ${referenceId} | Status: ${status} | Motivo: ${refusalReason}`);

      // Map PagBank status to our internal status
      const statusMap: Record<string, string> = {
        'PAID': 'PAID',
        'AUTHORIZED': 'AUTHORIZED',
        'IN_ANALYSIS': 'IN_ANALYSIS',
        'DECLINED': 'DECLINED',
        'CANCELED': 'CANCELED',
        'REFUNDED': 'REFUNDED',
        'WAITING_PAYMENT': 'WAITING_PAYMENT',
      };

      const internalStatus = statusMap[status] || status?.toUpperCase() || 'PENDING';

      // Try to find and update order in Firestore if reference_id matches
      if (referenceId && referenceId.startsWith('ORDER-')) {
        try {
          const ordersRef = collection(db, 'orders');
          const q = query(ordersRef, where('referenceId', '==', referenceId));
          const snap = await getDocs(q);

          if (!snap.empty) {
            const orderDoc = snap.docs[0];
            const updateData: any = {
              status: internalStatus,
              paymentStatus: internalStatus,
              pagbankStatus: status,
              updatedAt: new Date(),
            };
            
            // Add refusal reason if declined
            if (refusalReason) {
              updateData.refusalReason = refusalReason;
            }
            
            await updateDoc(doc(db, 'orders', orderDoc.id), updateData);
            console.log(`✅ [Webhook] Pedido ${referenceId} atualizado para: ${internalStatus}${refusalReason ? ` (Motivo: ${refusalReason})` : ''}`);
          } else {
            console.log(`⚠️ [Webhook] Pedido ${referenceId} não encontrado no Firestore.`);
          }
        } catch (firestoreErr) {
          console.error('❌ [Webhook] Erro ao atualizar Firestore:', firestoreErr);
        }
      }
    }

    // Always return 200 to PagBank so it doesn't retry
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error('❌ [Webhook] Erro ao processar:', error.message);
    // Still return 200 to avoid PagBank retry loops
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

// Allow GET for health check
export async function GET() {
  return NextResponse.json({ status: 'MayNutri PagBank Webhook Active ✅' });
}

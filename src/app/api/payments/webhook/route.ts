import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { eventType, data } = payload;

    if (!data?.paymentKey || !data?.orderId) {
      return NextResponse.json({ message: 'Invalid webhook payload' }, { status: 400 });
    }

    const { paymentKey, orderId } = data;
    const secretKey = process.env.TOSS_SECRET_KEY || 'test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6';
    const basicAuth = Buffer.from(`${secretKey}:`).toString('base64');

    // 1. [보안 검증] 웹훅 페이로드 맹신 금지 -> 토스페이먼츠 공식 단건 조회 API로 진위 검증
    const tossResponse = await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
      },
    });

    if (!tossResponse.ok) {
      console.error('Webhook: Toss API verification failed for paymentKey:', paymentKey);
      return NextResponse.json({ message: 'Toss API verification failed' }, { status: 400 });
    }

    const verifiedPayment = await tossResponse.json();
    const supabase = await createClient();

    // 2. 주문 상태에 맞게 DB 동기화
    if (verifiedPayment.status === 'DONE') {
      await supabase
        .from('orders')
        .update({
          status: 'paid',
          payment_key: paymentKey,
          payment_method: verifiedPayment.method || '카드',
          receipt_url: verifiedPayment.receipt?.url || null,
          paid_at: verifiedPayment.approvedAt || new Date().toISOString(),
        })
        .eq('order_number', orderId);
    } else if (verifiedPayment.status === 'CANCELED') {
      await supabase
        .from('orders')
        .update({
          status: 'refunded',
          cancelled_at: new Date().toISOString(),
          cancel_reason: verifiedPayment.cancels?.[0]?.cancelReason || '웹훅 취소 통보',
        })
        .eq('order_number', orderId);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paymentKey, orderId, amount } = body;

    if (!paymentKey || !orderId || amount === undefined) {
      return NextResponse.json(
        { success: false, message: '필수 결제 파라미터(paymentKey, orderId, amount)가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const requestedAmount = Number(amount);
    const supabase = await createClient();

    // 1. 주문서 사전 조회 및 상태 검증
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, order_number, total_amount, status')
      .eq('order_number', orderId)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, message: '주문 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 이미 결제 완료된 건 (멱등성 처리: 새로고침 또는 중복 요청 대비)
    if (order.status === 'paid') {
      return NextResponse.json({
        success: true,
        orderId: order.order_number,
        message: '이미 결제가 완료된 주문입니다.',
      });
    }

    // 2. [핵심 보안] 금액 변조 원천 차단 (Server Authority Check)
    if (order.total_amount !== requestedAmount) {
      console.error(
        `[SECURITY ALERT] 결제 금액 위변조 시도 감지! 주문번호: ${orderId}, DB금액: ${order.total_amount}, 요청금액: ${requestedAmount}`
      );
      return NextResponse.json(
        {
          success: false,
          code: 'INVALID_PAYMENT_AMOUNT',
          message: '결제 금액 위변조가 감지되었습니다. 주문 금액과 실제 승인 요청 금액이 일치하지 않습니다.',
        },
        { status: 400 }
      );
    }

    // 3. 토스페이먼츠 공식 결제 승인 API 호출
    const secretKey = process.env.TOSS_SECRET_KEY || 'test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6';
    const basicAuth = Buffer.from(`${secretKey}:`).toString('base64');

    const tossResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': orderId,
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: requestedAmount,
      }),
    });

    const tossData = await tossResponse.json();

    if (!tossResponse.ok) {
      console.error('Toss Payments confirm failed:', tossData);
      return NextResponse.json(
        {
          success: false,
          code: tossData.code || 'PAYMENT_CONFIRM_FAILED',
          message: tossData.message || '토스페이먼츠 결제 승인에 실패했습니다.',
        },
        { status: tossResponse.status }
      );
    }

    // 4. 결제 승인 성공 -> 주문 상태 'paid'로 갱신
    const paymentMethod = tossData.method || (tossData.card ? '카드' : '간편결제');
    const receiptUrl = tossData.receipt?.url || null;
    const paidAt = tossData.approvedAt || new Date().toISOString();

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        payment_key: paymentKey,
        payment_method: paymentMethod,
        receipt_url: receiptUrl,
        paid_at: paidAt,
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('Failed to update order to paid:', updateError);
    }

    // 5. 사용자의 장바구니에서 해당 주문 품목 비우기
    if (order.user_id) {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id')
        .eq('order_id', order.id);

      if (orderItems && orderItems.length > 0) {
        const productIds = orderItems.map((oi) => oi.product_id).filter(Boolean);
        await supabase
          .from('cart')
          .delete()
          .eq('user_id', order.user_id)
          .in('product_id', productIds);
      }
    }

    return NextResponse.json({
      success: true,
      orderId: order.order_number,
      paymentKey,
      paymentMethod,
      receiptUrl,
      approvedAt: paidAt,
      totalAmount: requestedAmount,
    });
  } catch (err: any) {
    console.error('Payment confirm server error:', err);
    return NextResponse.json(
      { success: false, message: '서버 내부 오류가 발생했습니다: ' + err.message },
      { status: 500 }
    );
  }
}

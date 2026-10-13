'use server';

import { createClient } from '@/lib/supabase/server';

interface OrderItemInput {
  productId: string;
  quantity: number;
}

interface CreateOrderParams {
  customerName: string;
  customerPhone: string;
  address: string;
  zipcode?: string;
  deliveryMemo?: string;
  items: OrderItemInput[];
}

/**
 * 결제 전 '대기(pending)' 상태의 주문을 안전하게 서버에서 생성
 * - 브라우저가 전달한 가격은 무시하고, 서버 DB(products)의 실시간 가격으로 재계산
 * - 품절 또는 판매 중지 상품 사전 차단
 */
export async function createPendingOrder(params: CreateOrderParams) {
  const { customerName, customerPhone, address, zipcode, deliveryMemo, items } = params;

  if (!customerName?.trim() || !customerPhone?.trim() || !address?.trim()) {
    return { success: false, error: '주문자 정보 및 배송지를 정확히 입력해 주세요.' };
  }

  if (!items || items.length === 0) {
    return { success: false, error: '주문할 상품이 없습니다.' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. 주문할 상품들의 최신 정보 DB 조회
  const productIds = items.map((i) => i.productId);
  const { data: dbProducts, error: productError } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds);

  if (productError || !dbProducts || dbProducts.length === 0) {
    return { success: false, error: '상품 정보를 불러오지 못했습니다.' };
  }

  const productMap = new Map(dbProducts.map((p) => [p.id, p]));

  // 2. 재고/판매 상태 검증 및 서버 기준 총액 계산
  let subtotal = 0;
  const validatedItems: Array<{
    productId: string;
    productTitle: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
  }> = [];

  for (const item of items) {
    const product = productMap.get(item.productId);

    if (!product) {
      return { success: false, error: `상품(ID: ${item.productId})을 찾을 수 없습니다.` };
    }

    if (product.status && product.status !== 'active') {
      return { success: false, error: `'${product.title}' 상품은 현재 품절 또는 판매가 중지되었습니다.` };
    }

    const qty = Math.max(1, item.quantity);
    const unitPrice = product.price || 0;
    const itemTotal = unitPrice * qty;

    subtotal += itemTotal;
    validatedItems.push({
      productId: product.id,
      productTitle: product.title,
      unitPrice,
      quantity: qty,
      totalPrice: itemTotal,
    });
  }

  // 3. 배송비 계산: 50,000원 이상 무료배송, 미만 3,000원
  const shippingFee = subtotal >= 50000 ? 0 : 3000;
  const totalAmount = subtotal + shippingFee;

  // 세무 공급가액 / 부가세 자동 계산 (10% 부가세)
  const supplyAmount = Math.round(totalAmount / 1.1);
  const vatAmount = totalAmount - supplyAmount;

  // 4. 고유하고 예측 불가능한 주문 번호 채번 (ORD-YYYYMMDD-랜덤)
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  const orderNumber = `ORD-${dateStr}-${randomStr}`;

  // 5. 주문(orders) 테이블에 'pending' 상태로 삽입
  const { data: orderData, error: orderInsertError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      user_id: user?.id || null,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      address: address.trim(),
      zipcode: zipcode?.trim() || '',
      delivery_memo: deliveryMemo?.trim() || '',
      carrier: 'CJ대한통운',
      supply_amount: supplyAmount,
      vat_amount: vatAmount,
      total_amount: totalAmount,
      status: 'pending',
    })
    .select('id, order_number, total_amount')
    .single();

  if (orderInsertError || !orderData) {
    console.error('Order creation error:', orderInsertError);
    return { success: false, error: '주문 생성에 실패했습니다: ' + orderInsertError?.message };
  }

  // 6. 주문 상세 품목(order_items) 테이블 삽입
  const orderItemRows = validatedItems.map((item) => {
    const itemSupply = Math.round(item.totalPrice / 1.1);
    const itemVat = item.totalPrice - itemSupply;

    return {
      order_id: orderData.id,
      product_id: item.productId,
      product_title: item.productTitle,
      spec: 'FREE',
      quantity: item.quantity,
      unit_price: item.unitPrice,
      supply_amount: itemSupply,
      vat_amount: itemVat,
      total_amount: item.totalPrice,
    };
  });

  const { error: itemsInsertError } = await supabase
    .from('order_items')
    .insert(orderItemRows);

  if (itemsInsertError) {
    console.error('Order items insertion error:', itemsInsertError);
    return { success: false, error: '주문 상세 품목 등록 실패: ' + itemsInsertError.message };
  }

  // 주문명 생성 (예: "Superdry 볼캡 외 2건")
  const orderName = validatedItems.length > 1
    ? `${validatedItems[0].productTitle} 외 ${validatedItems.length - 1}건`
    : validatedItems[0].productTitle;

  return {
    success: true,
    orderId: orderData.order_number,
    totalAmount,
    shippingFee,
    subtotal,
    orderName,
    customerName,
    customerPhone,
  };
}

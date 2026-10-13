'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { loadTossPayments, ANONYMOUS, type TossPaymentsWidgets } from '@tosspayments/tosspayments-sdk';
import { createPendingOrder } from '@/app/actions/payment';
import { ShieldCheck, Truck, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface CheckoutItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  is_bundle_1plus1?: boolean;
}

interface CheckoutFormProps {
  initialItems: CheckoutItem[];
  userProfile?: {
    id: string;
    name?: string;
    email?: string;
  } | null;
}

export default function CheckoutForm({ initialItems, userProfile }: CheckoutFormProps) {
  const router = useRouter();

  // Form states
  const [customerName, setCustomerName] = useState(userProfile?.name || '');
  const [customerPhone, setCustomerPhone] = useState('010-');
  const [zipcode, setZipcode] = useState('06236');
  const [address, setAddress] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [deliveryMemo, setDeliveryMemo] = useState('문 앞에 놓아주세요');

  // Terms agreement states
  const [agreePrivacy, setAgreePrivacy] = useState(true);
  const [agreePurchase, setAgreePurchase] = useState(true);

  // Processing state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const [widgetError, setWidgetError] = useState<string | null>(null);

  // Toss Payments Widgets Ref
  const widgetsRef = useRef<TossPaymentsWidgets | null>(null);

  // Calculate order price
  const subtotal = initialItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingFee = subtotal >= 50000 || subtotal === 0 ? 0 : 3000;
  const totalAmount = subtotal + shippingFee;

  // 1. Initialize Toss Payments Widget
  useEffect(() => {
    let isMounted = true;

    async function initTossWidget() {
      try {
        const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm';
        const customerKey = userProfile?.id 
          ? `USER_${userProfile.id.replace(/[^a-zA-Z0-9_\-=]/g, '')}` 
          : ANONYMOUS;

        const tossPayments = await loadTossPayments(clientKey);
        if (!isMounted) return;

        const widgets = tossPayments.widgets({ customerKey });
        widgetsRef.current = widgets;

        // 결제 금액 설정
        await widgets.setAmount({
          currency: 'KRW',
          value: totalAmount,
        });
        if (!isMounted) return;

        // 결제 수단 UI 렌더링
        await widgets.renderPaymentMethods({
          selector: '#payment-method',
          variantKey: 'DEFAULT',
        });
        if (!isMounted) return;

        // 이용약관 UI 렌더링
        try {
          await widgets.renderAgreement({
            selector: '#agreement',
            variantKey: 'AGREEMENT',
          });
        } catch (agreementErr) {
          console.warn('Agreement widget render warning:', agreementErr);
        }

        if (isMounted) {
          setWidgetReady(true);
          setWidgetError(null);
        }
      } catch (err: any) {
        console.error('Toss Payments Widget init error:', err);
        if (isMounted) {
          setWidgetError('결제 위젯을 불러오는 중 오류가 발생했습니다: ' + (err.message || ''));
        }
      }
    }

    if (totalAmount > 0) {
      initTossWidget();
    }

    return () => {
      isMounted = false;
    };
  }, [totalAmount, userProfile?.id]);

  // Handle Payment Click
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    // Validation
    if (!customerName.trim()) {
      alert('주문자 성함을 입력해 주세요.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.length < 10) {
      alert('올바른 휴대폰 번호를 입력해 주세요.');
      return;
    }
    if (!address.trim()) {
      alert('배송지 주소를 입력해 주세요.');
      return;
    }
    if (!agreePrivacy || !agreePurchase) {
      alert('필수 약관(개인정보 수집 및 구매조건)에 모두 동의해 주세요.');
      return;
    }

    if (!widgetsRef.current) {
      alert('결제 위젯이 아직 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const fullAddress = detailAddress.trim() ? `${address.trim()}, ${detailAddress.trim()}` : address.trim();

      // 1. 서버에서 안전하게 pending 주문 생성 및 기준 금액 산출
      const res = await createPendingOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        address: fullAddress,
        zipcode: zipcode.trim(),
        deliveryMemo: deliveryMemo.trim(),
        items: initialItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      });

      if (!res.success || !res.orderId) {
        alert(res.error || '주문 생성에 실패했습니다.');
        setIsSubmitting(false);
        return;
      }

      // 2. 토스페이먼츠 결제창 호출
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const widgets = widgetsRef.current;

      await widgets.requestPayment({
        orderId: res.orderId,
        orderName: res.orderName || '모자 상품 주문',
        successUrl: `${origin}/order/success`,
        failUrl: `${origin}/order/fail`,
        customerName: customerName.trim(),
        customerMobilePhone: customerPhone.replace(/[^0-9]/g, ''),
        customerEmail: userProfile?.email || undefined,
      });
    } catch (err: any) {
      console.error('Request payment failed:', err);
      if (err.code === 'USER_CANCEL') {
        // 사용자가 결제창을 닫은 경우
        console.log('User cancelled payment window');
      } else {
        alert('결제 진행 중 오류가 발생했습니다: ' + (err.message || ''));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handlePaymentSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Delivery & Buyer Info & Toss Widget */}
      <div className="lg:col-span-7 space-y-6">
        {/* Buyer & Delivery Info */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b pb-4">
            <Truck className="w-5 h-5" /> 배송지 및 주문자 정보
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                주문자 이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="홍길동"
                className="w-full border rounded-xl px-3.5 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                휴대폰 번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="010-1234-5678"
                className="w-full border rounded-xl px-3.5 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex gap-2">
              <div className="w-32">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">우편번호</label>
                <input
                  type="text"
                  value={zipcode}
                  onChange={(e) => setZipcode(e.target.value)}
                  placeholder="06236"
                  className="w-full border rounded-xl px-3.5 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  기본 주소 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="서울특별시 강남구 테헤란로 152"
                  className="w-full border rounded-xl px-3.5 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">상세 주소</label>
              <input
                type="text"
                value={detailAddress}
                onChange={(e) => setDetailAddress(e.target.value)}
                placeholder="강남파이낸스센터 12층 (동/호수)"
                className="w-full border rounded-xl px-3.5 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">배송 요청 사항</label>
              <select
                value={deliveryMemo}
                onChange={(e) => setDeliveryMemo(e.target.value)}
                className="w-full border rounded-xl px-3.5 py-2.5 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="문 앞에 놓아주세요">문 앞에 놓아주세요</option>
                <option value="배송 전 연락 바랍니다">배송 전 연락 바랍니다</option>
                <option value="부재 시 경비실에 맡겨주세요">부재 시 경비실에 맡겨주세요</option>
                <option value="택배함에 넣어주세요">택배함에 넣어주세요</option>
                <option value="직접 수령하겠습니다">직접 수령하겠습니다</option>
              </select>
            </div>
          </div>
        </div>

        {/* Toss Payments Widget Section */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900 border-b pb-4">결제 수단 선택</h2>

          {widgetError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>{widgetError}</div>
            </div>
          )}

          {/* Toss Payments Method Container */}
          <div id="payment-method" className="min-h-[280px]">
            {!widgetReady && !widgetError && (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-black" />
                <span className="text-xs">토스페이먼츠 보안 결제창을 불러오는 중입니다...</span>
              </div>
            )}
          </div>

          {/* Toss Payments Agreement Container */}
          <div id="agreement" className="border-t pt-2" />
        </div>

        {/* E-Commerce Required Agreements */}
        <div className="bg-gray-50 border rounded-2xl p-5 space-y-3 text-xs text-gray-600">
          <div className="font-bold text-gray-800 text-sm mb-1">전자상거래 이용자 동의</div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreePrivacy}
              onChange={(e) => setAgreePrivacy(e.target.checked)}
              className="w-4 h-4 rounded text-black focus:ring-black accent-black cursor-pointer"
            />
            <span>[필수] 개인정보 수집 및 제3자 제공 동의 (배송 및 결제사 위탁)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreePurchase}
              onChange={(e) => setAgreePurchase(e.target.checked)}
              className="w-4 h-4 rounded text-black focus:ring-black accent-black cursor-pointer"
            />
            <span>[필수] 구매조건 확인 및 결제진행 동의 (환불 및 교환규정 숙지)</span>
          </label>
        </div>
      </div>

      {/* Right Column: Order Items Summary & Final CTA */}
      <div className="lg:col-span-5 sticky top-24 space-y-6">
        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-gray-900 border-b pb-4">
            주문 상품 ({initialItems.length}종류)
          </h2>

          {/* Item List */}
          <div className="max-h-64 overflow-y-auto space-y-3 pr-1 hide-scrollbar">
            {initialItems.map((item) => (
              <div key={item.productId} className="flex gap-3 items-center py-1">
                <div className="relative w-14 h-14 bg-gray-50 rounded-lg overflow-hidden shrink-0 border">
                  <Image
                    src={item.image || '/cap-superdry.png'}
                    alt={item.title}
                    fill
                    className="object-contain p-1.5"
                  />
                  {item.is_bundle_1plus1 && (
                    <span className="absolute top-0.5 left-0.5 bg-red-600 text-white text-[9px] font-bold px-1 rounded">
                      1+1
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-xs truncate" title={item.title}>
                    {item.title}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    수량: {item.quantity}개
                  </div>
                </div>
                <div className="font-bold text-sm text-gray-900 whitespace-nowrap">
                  {(item.price * item.quantity).toLocaleString()}원
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Breakdown */}
          <div className="border-t pt-4 space-y-2.5 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>상품 금액</span>
              <span className="font-semibold text-gray-900">{subtotal.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span>배송비</span>
              <span className="font-semibold text-gray-900">
                {shippingFee === 0 ? '무료' : `${shippingFee.toLocaleString()}원`}
              </span>
            </div>
            {shippingFee === 0 && (
              <p className="text-[11px] text-green-600">
                ✓ 50,000원 이상 구매 무료배송 적용
              </p>
            )}
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-baseline mb-2">
              <span className="font-bold text-gray-900 text-base">최종 결제 금액</span>
              <span className="text-2xl font-black text-red-600">
                {totalAmount.toLocaleString()}원
              </span>
            </div>
          </div>

          {/* Pay Button */}
          <button
            type="submit"
            disabled={isSubmitting || !widgetReady}
            className="w-full bg-black hover:bg-gray-800 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>결제 진행 중...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>{totalAmount.toLocaleString()}원 안전 결제하기</span>
              </>
            )}
          </button>

          <div className="flex justify-between items-center text-xs text-gray-400 pt-2 border-t">
            <Link href="/cart" className="flex items-center gap-1 hover:text-black">
              <ArrowLeft className="w-3.5 h-3.5" /> 장바구니로 돌아가기
            </Link>
            <span className="flex items-center gap-1 text-[11px]">
              🔒 256-bit SSL 암호화 결제
            </span>
          </div>
        </div>
      </div>
    </form>
  );
}

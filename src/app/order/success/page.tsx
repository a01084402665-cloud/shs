'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ShieldCheck, FileText, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<{
    orderId: string;
    totalAmount: number;
    paymentMethod: string;
    receiptUrl?: string;
  } | null>(null);

  useEffect(() => {
    let isCalled = false;

    async function confirmPayment() {
      if (!paymentKey || !orderId || !amount) {
        setError('결제 승인 필수 정보가 누락되었습니다.');
        setIsLoading(false);
        return;
      }

      if (isCalled) return;
      isCalled = true;

      try {
        const res = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: Number(amount),
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.message || '결제 승인 처리에 실패했습니다.');
          setIsLoading(false);
          return;
        }

        // Global event dispatch to reset header cart badge
        window.dispatchEvent(new CustomEvent('cart-updated'));

        setOrderResult({
          orderId: data.orderId || orderId,
          totalAmount: data.totalAmount || Number(amount),
          paymentMethod: data.paymentMethod || '신용카드/간편결제',
          receiptUrl: data.receiptUrl,
        });
      } catch (err: any) {
        console.error('Confirm error:', err);
        setError('결제 승인 중 네트워크 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    }

    confirmPayment();
  }, [paymentKey, orderId, amount]);

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto py-24 text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">결제 승인 처리 중입니다</h2>
        <p className="text-sm text-gray-500">
          토스페이먼츠와 안전하게 결제를 검증하고 있습니다. 브라우저를 닫지 마세요.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto py-24 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">결제 승인 실패</h2>
        <p className="text-sm text-red-600 mb-8 bg-red-50 p-4 rounded-xl border border-red-200">
          {error}
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/cart"
            className="bg-black hover:bg-gray-800 text-white font-bold px-6 py-3.5 rounded-xl transition-colors"
          >
            장바구니로 돌아가기
          </Link>
          <Link
            href="/"
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-6 py-3.5 rounded-xl transition-colors"
          >
            홈으로 이동
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-16 px-4">
      <div className="bg-white border rounded-3xl p-8 shadow-sm text-center">
        <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">
          결제가 정상 완료되었습니다!
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          주문해 주셔서 감사합니다. 주문하신 모자는 꼼꼼히 검수하여 신속하게 배송해 드리겠습니다.
        </p>

        {/* Order Details Card */}
        <div className="bg-gray-50 rounded-2xl p-6 text-left space-y-3.5 mb-8 border border-gray-100">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">주문 번호</span>
            <span className="font-bold text-gray-900">{orderResult?.orderId}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">결제 수단</span>
            <span className="font-semibold text-gray-900">{orderResult?.paymentMethod}</span>
          </div>
          <div className="flex justify-between text-sm border-t pt-3">
            <span className="text-gray-700 font-semibold">총 결제 금액</span>
            <span className="font-extrabold text-lg text-red-600">
              {orderResult?.totalAmount.toLocaleString()}원
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {orderResult?.receiptUrl && (
            <a
              href={orderResult.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
            >
              <FileText className="w-4 h-4" /> 카드 매출전표(영수증) 확인
            </a>
          )}

          <div className="flex gap-3">
            <Link
              href="/"
              className="flex-1 bg-black hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl transition-colors text-sm"
            >
              쇼핑 계속하기
            </Link>
            <Link
              href="/mypage"
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3.5 rounded-xl transition-colors text-sm"
            >
              주문내역 조회
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-black mb-4" />
          <p className="text-sm text-gray-500">결제 완료 정보를 불러오는 중입니다...</p>
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}

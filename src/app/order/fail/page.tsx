'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { XCircle, RefreshCw, ShoppingBag, ArrowLeft } from 'lucide-react';

function OrderFailContent() {
  const searchParams = useSearchParams();

  const code = searchParams.get('code') || 'PAYMENT_FAILED';
  const message = searchParams.get('message') || '결제 진행 중 오류가 발생했습니다.';
  const orderId = searchParams.get('orderId');

  return (
    <div className="max-w-md mx-auto py-20 px-4 text-center">
      <div className="bg-white border rounded-3xl p-8 shadow-sm">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">결제에 실패했습니다</h1>
        <p className="text-sm text-gray-500 mb-6">
          선택하신 결제 수단으로 승인되지 않았습니다. 원인을 확인하신 후 다시 시도해 주세요.
        </p>

        {/* Error Info Box */}
        <div className="bg-red-50/70 border border-red-200 rounded-2xl p-5 text-left text-xs space-y-2 mb-8">
          <div className="flex justify-between">
            <span className="text-gray-500">실패 사유</span>
            <span className="font-bold text-red-600 text-right">{message}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>오류 코드</span>
            <span className="font-mono">{code}</span>
          </div>
          {orderId && (
            <div className="flex justify-between text-gray-400">
              <span>주문 번호</span>
              <span className="font-mono">{orderId}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/checkout"
            className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
          >
            <RefreshCw className="w-4 h-4" /> 다시 결제 시도하기
          </Link>
          <Link
            href="/cart"
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <ShoppingBag className="w-4 h-4" /> 장바구니로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderFailPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm text-gray-400">오류 정보를 불러오는 중입니다...</div>}>
      <OrderFailContent />
    </Suspense>
  );
}

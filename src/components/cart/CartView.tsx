'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { updateCartQuantity, removeFromCart, clearCart } from '@/app/actions/cart';
import { useRouter } from 'next/navigation';

export interface CartItemType {
  id: string;
  quantity: number;
  created_at: string;
  product: {
    id: string;
    title: string;
    price: number;
    images?: string[];
    is_bundle_1plus1?: boolean;
    status?: string;
  } | null;
}

export default function CartView({ initialItems }: { initialItems: CartItemType[] }) {
  const [items, setItems] = useState<CartItemType[]>(initialItems);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialItems.map((i) => i.id));
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const router = useRouter();

  // Selected items calculation
  const selectedItems = items.filter((item) => selectedIds.includes(item.id) && item.product);

  const subtotal = selectedItems.reduce((sum, item) => {
    return sum + (item.product?.price || 0) * item.quantity;
  }, 0);

  // Delivery fee: Free for orders >= 50,000 KRW or if cart has items, e.g., 3,000 KRW
  const shippingFee = subtotal >= 50000 || subtotal === 0 ? 0 : 3000;
  const totalAmount = subtotal + shippingFee;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(items.map((i) => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleQuantityChange = async (cartId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;

    // Optimistic update
    setItems((prev) =>
      prev.map((item) => (item.id === cartId ? { ...item, quantity: newQty } : item))
    );

    try {
      await updateCartQuantity(cartId, newQty);
      window.dispatchEvent(new CustomEvent('cart-updated'));
    } catch (err) {
      console.error(err);
      router.refresh();
    }
  };

  const handleRemove = async (cartId: string) => {
    if (!confirm('이 상품을 장바구니에서 삭제하시겠습니까?')) return;

    setItems((prev) => prev.filter((item) => item.id !== cartId));
    setSelectedIds((prev) => prev.filter((id) => id !== cartId));

    try {
      await removeFromCart(cartId);
      window.dispatchEvent(new CustomEvent('cart-updated'));
    } catch (err) {
      console.error(err);
      router.refresh();
    }
  };

  const handleClearAll = async () => {
    if (!confirm('장바구니의 모든 상품을 비우시겠습니까?')) return;

    setItems([]);
    setSelectedIds([]);

    try {
      await clearCart();
      window.dispatchEvent(new CustomEvent('cart-updated'));
    } catch (err) {
      console.error(err);
      router.refresh();
    }
  };

  const handleOrder = () => {
    if (selectedItems.length === 0) {
      alert('주문할 상품을 1개 이상 선택해 주세요.');
      return;
    }

    router.push('/checkout');
  };

  if (orderComplete) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">주문이 성공적으로 접수되었습니다!</h2>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          총 결제금액: <strong className="text-black font-extrabold text-base">{totalAmount.toLocaleString()}원</strong><br />
          신속하고 안전하게 포장하여 배송해 드리겠습니다.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="bg-black hover:bg-gray-800 text-white font-bold px-6 py-3.5 rounded-xl transition-colors"
          >
            쇼핑 계속하기
          </Link>
          <Link
            href="/mypage"
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-6 py-3.5 rounded-xl transition-colors"
          >
            주문내역 확인
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-24 bg-gray-50 rounded-2xl border border-dashed border-gray-300 max-w-xl mx-auto my-8">
        <div className="w-16 h-16 bg-white text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">장바구니가 비어 있습니다</h2>
        <p className="text-sm text-gray-400 mb-8">
          원하시는 모자를 장바구니에 담아 간편하게 주문해 보세요.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-black hover:bg-gray-800 text-white text-sm font-semibold px-6 py-3.5 rounded-xl transition-all shadow-sm"
        >
          모자 둘러보러 가기 <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const isAllSelected = items.length > 0 && selectedIds.length === items.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Items List */}
      <div className="lg:col-span-2 space-y-4">
        {/* Table Header / Action Bar */}
        <div className="bg-white border rounded-xl p-4 flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded text-black focus:ring-black accent-black cursor-pointer"
            />
            전체 선택 ({selectedIds.length}/{items.length})
          </label>
          <button
            onClick={handleClearAll}
            className="text-xs text-gray-400 hover:text-red-600 transition-colors"
          >
            전체 삭제
          </button>
        </div>

        {/* Cart Item Cards */}
        <div className="space-y-3">
          {items.map((item) => {
            const product = item.product;
            if (!product) return null;

            const imgSrc = product.images?.[0] || '/cap-superdry.png';
            const isSelected = selectedIds.includes(item.id);
            const itemTotal = (product.price || 0) * item.quantity;

            return (
              <div
                key={item.id}
                className={`bg-white border rounded-xl p-4 sm:p-5 transition-shadow hover:shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  !isSelected ? 'opacity-60 bg-gray-50/50' : ''
                }`}
              >
                {/* Checkbox & Thumbnail & Title */}
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleSelectToggle(item.id)}
                    className="w-4 h-4 rounded text-black focus:ring-black accent-black cursor-pointer shrink-0"
                  />
                  <Link
                    href={`/product/${product.id}`}
                    className="relative w-20 h-20 bg-gray-50 rounded-lg overflow-hidden shrink-0 border"
                  >
                    <Image
                      src={imgSrc}
                      alt={product.title}
                      fill
                      className="object-contain p-2"
                    />
                    {product.is_bundle_1plus1 && (
                      <span className="absolute top-1 left-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded">
                        1+1
                      </span>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${product.id}`}
                      className="font-semibold text-gray-900 text-sm hover:underline line-clamp-1"
                    >
                      {product.title}
                    </Link>
                    <div className="text-sm font-bold text-gray-900 mt-1">
                      {product.price.toLocaleString()}원
                    </div>
                  </div>
                </div>

                {/* Quantity Controls & Subtotal */}
                <div className="flex items-center justify-between w-full sm:w-auto sm:gap-6 border-t sm:border-t-0 pt-3 sm:pt-0">
                  <div className="flex items-center border rounded-lg overflow-hidden bg-gray-50">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                      disabled={item.quantity <= 1}
                      className="p-1.5 px-2 hover:bg-gray-200 disabled:opacity-30 transition-colors"
                      aria-label="수량 감소"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center text-sm font-bold bg-white py-1">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                      className="p-1.5 px-2 hover:bg-gray-200 transition-colors"
                      aria-label="수량 증가"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right min-w-[90px]">
                    <div className="text-base font-extrabold text-black">
                      {itemTotal.toLocaleString()}원
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="text-gray-400 hover:text-red-500 p-1.5 transition-colors"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Summary Card */}
      <div className="bg-white border rounded-2xl p-6 shadow-sm sticky top-24 space-y-6">
        <h3 className="font-bold text-lg text-gray-900 border-b pb-4">주문 결제 금액</h3>

        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>선택 상품 ({selectedItems.length}개)</span>
            <span className="font-semibold text-gray-900">{subtotal.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between">
            <span className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-gray-400" /> 배송비
            </span>
            <span className="font-semibold text-gray-900">
              {shippingFee === 0 ? '무료 (5만원 이상)' : `${shippingFee.toLocaleString()}원`}
            </span>
          </div>
          <p className="text-xs text-gray-400 pt-1">
            * 50,000원 이상 구매 시 무료배송 혜택 적용
          </p>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-baseline mb-1">
            <span className="font-bold text-gray-900">총 결제 예정 금액</span>
            <span className="text-2xl font-black text-red-600">
              {totalAmount.toLocaleString()}원
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOrder}
          disabled={selectedItems.length === 0 || isProcessing}
          className="w-full bg-black hover:bg-gray-800 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          {isProcessing ? '주문 처리 중...' : `총 ${selectedItems.length}개 상품 주문하기`}
        </button>

        <Link
          href="/"
          className="block text-center text-xs text-gray-500 hover:text-black hover:underline"
        >
          ← 다른 모자 상품 더 보러가기
        </Link>
      </div>
    </div>
  );
}

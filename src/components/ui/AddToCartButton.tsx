'use client';

import { useState } from 'react';
import { ShoppingBag, Loader2 } from 'lucide-react';
import { addToCart } from '@/app/actions/cart';
import { useRouter } from 'next/navigation';

interface AddToCartButtonProps {
  productId: string;
  quantity?: number;
  variant?: 'icon' | 'button' | 'outline' | 'subtle';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
  text?: string;
}

export default function AddToCartButton({
  productId,
  quantity = 1,
  variant = 'icon',
  size = 'md',
  className = '',
  showText = false,
  text = '장바구니 담기',
}: AddToCartButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    setIsLoading(true);

    try {
      const res = await addToCart(productId, quantity);

      if (res.requireLogin) {
        if (confirm('로그인이 필요한 서비스입니다.\n로그인 페이지로 이동하시겠습니까?')) {
          router.push('/login');
        }
        return;
      }

      if (!res.success) {
        alert(res.message || res.error || '장바구니 담기에 실패했습니다.');
        return;
      }

      // Dispatch global event for instant cart counter refresh across components
      window.dispatchEvent(new CustomEvent('cart-updated'));

      const goToCart = confirm('🛒 상품이 장바구니에 담겼습니다!\n\n장바구니 페이지로 바로 이동하시겠습니까?');
      if (goToCart) {
        router.push('/cart');
      }
    } catch (err: any) {
      console.error('Add to cart error:', err);
      alert('장바구니 추가 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Icon size mapping
  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 20,
  };

  if (variant === 'button' || variant === 'outline') {
    const baseStyle = variant === 'outline'
      ? 'border-2 border-black bg-white text-black hover:bg-gray-100'
      : 'bg-black text-white hover:bg-gray-800';

    return (
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isLoading}
        className={`flex items-center justify-center gap-2 rounded-xl font-bold transition-all duration-200 cursor-pointer disabled:opacity-50 ${baseStyle} ${
          size === 'sm' ? 'px-3 py-2 text-xs' : size === 'lg' ? 'px-6 py-4 text-base' : 'px-4 py-3 text-sm'
        } ${className}`}
      >
        {isLoading ? (
          <Loader2 size={iconSizes[size]} className="animate-spin" />
        ) : (
          <ShoppingBag size={iconSizes[size]} />
        )}
        <span>{text}</span>
      </button>
    );
  }

  // Subtle button style (for wishlist item card or compact areas)
  if (variant === 'subtle') {
    return (
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isLoading}
        className={`w-full bg-gray-900 hover:bg-black text-white text-xs font-semibold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 ${className}`}
      >
        {isLoading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <ShoppingBag size={14} />
        )}
        <span>{text}</span>
      </button>
    );
  }

  // Default 'icon' floating badge button (e.g. over product images)
  return (
    <button
      type="button"
      onClick={handleAddToCart}
      disabled={isLoading}
      aria-label="장바구니 담기"
      title="장바구니 담기"
      className={`p-2 rounded-full transition-all duration-200 cursor-pointer disabled:opacity-50 bg-white/90 hover:bg-white text-gray-700 hover:text-black hover:scale-110 shadow-sm backdrop-blur-sm ${className}`}
    >
      {isLoading ? (
        <Loader2 size={iconSizes[size]} className="animate-spin text-gray-600" />
      ) : (
        <ShoppingBag size={iconSizes[size]} />
      )}
    </button>
  );
}

'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { toggleWishlist } from '@/app/actions/wishlist';
import { useRouter } from 'next/navigation';

interface WishlistButtonProps {
  productId: string;
  initialIsLiked?: boolean;
  className?: string;
  size?: number;
}

export default function WishlistButton({
  productId,
  initialIsLiked = false,
  className = '',
  size = 20,
}: WishlistButtonProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    setIsLoading(true);
    // Optimistic UI update
    const previousState = isLiked;
    setIsLiked(!previousState);

    try {
      const res = await toggleWishlist(productId);

      if (res.requireLogin) {
        setIsLiked(previousState);
        if (confirm('로그인이 필요한 서비스입니다.\n로그인 페이지로 이동하시겠습니까?')) {
          router.push('/login');
        }
        return;
      }

      if (!res.success) {
        setIsLiked(previousState);
        alert(res.message || res.error || '찜하기 처리에 실패했습니다. (SQL 테이블 생성 필요)');
        return;
      }

      setIsLiked(!!res.isLiked);
    } catch (err: any) {
      setIsLiked(previousState);
      console.error('Wishlist toggle error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isLoading}
      aria-label={isLiked ? '찜 취소' : '상품 찜하기'}
      className={`p-2 rounded-full transition-all duration-200 cursor-pointer ${
        isLiked 
          ? 'bg-red-50 text-red-500 scale-105 shadow-sm' 
          : 'bg-white/80 hover:bg-white text-gray-400 hover:text-red-500 hover:scale-110 shadow-sm backdrop-blur-sm'
      } ${className}`}
    >
      <Heart
        size={size}
        className={`transition-colors duration-200 ${
          isLiked ? 'fill-red-500 text-red-500' : 'text-gray-500 hover:text-red-500'
        }`}
      />
    </button>
  );
}

'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, Search, ShoppingBag, User, X, Heart } from 'lucide-react';
import { logout } from '@/app/login/actions';
import { type User as SupabaseUser } from '@supabase/supabase-js';
import { getCartCount } from '@/app/actions/cart';

const CATEGORIES = [
  { name: 'NEW', href: '/category/new' },
  { name: 'BEST', href: '/category/best' },
  { name: '볼캡', href: '/category/ballcap' },
  { name: '버킷햇', href: '/category/buckethat' },
  { name: '비니', href: '/category/beanie' },
  { name: '기타 모자', href: '/category/etc' },
  { name: '기획전', href: '/promotion' },
];

interface HeaderProps {
  user: SupabaseUser | null;
  isAdmin?: boolean;
  userName?: string;
  cartCount?: number;
}

export default function Header({ user, isAdmin = false, userName, cartCount = 0 }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentCartCount, setCurrentCartCount] = useState(cartCount);
  const displayName = userName || user?.user_metadata?.name || '고객';

  useEffect(() => {
    setCurrentCartCount(cartCount);
  }, [cartCount]);

  useEffect(() => {
    const handleCartUpdated = async () => {
      try {
        const count = await getCartCount();
        setCurrentCartCount(count);
      } catch (e) {
        console.error(e);
      }
    };

    window.addEventListener('cart-updated', handleCartUpdated);
    return () => window.removeEventListener('cart-updated', handleCartUpdated);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      {/* Top Utility Bar (Desktop only) */}
      <div className="hidden w-full bg-gray-50 py-1 text-xs text-gray-500 md:block">
        <div className="container mx-auto flex justify-end gap-4 px-4 items-center">
          {user ? (
            <>
              <span className="text-black font-medium">{displayName}님</span>
              {isAdmin && (
                <Link 
                  href="/admin/products" 
                  className="font-bold text-red-600 hover:text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded"
                >
                  ⚙️ 관리자 페이지
                </Link>
              )}
              <button onClick={() => logout()} className="hover:text-black">로그아웃</button>
              <Link href="/wishlist" className="hover:text-black flex items-center gap-1 font-medium text-gray-700">
                <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" /> 찜한 상품
              </Link>
              <Link href="/mypage" className="hover:text-black">마이페이지</Link>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-black">로그인</Link>
              <Link href="/signup" className="hover:text-black">회원가입</Link>
              <Link href="/wishlist" className="hover:text-black flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-gray-400" /> 찜한 상품
              </Link>
              <Link href="/mypage" className="hover:text-black">마이페이지</Link>
            </>
          )}
          <Link href="/cart" className="hover:text-black font-medium">
            장바구니 ({currentCartCount})
          </Link>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="메뉴 열기"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Logo */}
          <Link href="/" className="text-xl font-semibold tracking-widest">
            HAT.
          </Link>

          {/* Desktop GNB */}
          <nav className="hidden space-x-8 md:flex">
            {CATEGORIES.map((category) => (
              <Link 
                key={category.name} 
                href={category.href}
                className="text-sm font-medium hover:text-blue-600 transition-colors"
              >
                {category.name}
              </Link>
            ))}
          </nav>

          {/* Icons (Desktop & Mobile) */}
          <div className="flex items-center space-x-4">
            <button aria-label="검색">
              <Search className="h-5 w-5" />
            </button>
            <Link href="/wishlist" aria-label="찜한 상품" className="text-gray-700 hover:text-red-500 transition-colors" title="찜한 상품">
              <Heart className="h-5 w-5" />
            </Link>
            <Link href="/cart" aria-label="장바구니" className="relative text-gray-700 hover:text-black transition-colors" title="장바구니">
              <ShoppingBag className="h-5 w-5" />
              {currentCartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {currentCartCount > 99 ? '99+' : currentCartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="relative flex w-4/5 max-w-sm flex-col bg-white h-full shadow-xl">
            <div className="flex items-center justify-between border-b p-4">
              <span className="text-lg font-semibold tracking-widest">HAT.</span>
              <button onClick={() => setIsMobileMenuOpen(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex flex-col border-b text-sm p-4 gap-4 bg-gray-50">
              {user ? (
                <>
                  <span className="text-black font-bold">{displayName}님 환영합니다</span>
                  <div className="flex gap-4 items-center flex-wrap">
                    {isAdmin && (
                      <Link 
                        href="/admin/products" 
                        className="font-bold text-red-600 hover:text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-xs" 
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        ⚙️ 관리자
                      </Link>
                    )}
                    <button onClick={() => logout()} className="text-gray-500 hover:text-black">로그아웃</button>
                    <Link href="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="text-red-600 font-semibold">찜한 상품</Link>
                    <Link href="/mypage" onClick={() => setIsMobileMenuOpen(false)}>마이페이지</Link>
                  </div>
                </>
              ) : (
                <div className="flex gap-4 flex-wrap">
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>로그인</Link>
                  <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>회원가입</Link>
                  <Link href="/wishlist" onClick={() => setIsMobileMenuOpen(false)}>찜한 상품</Link>
                  <Link href="/mypage" onClick={() => setIsMobileMenuOpen(false)}>마이페이지</Link>
                </div>
              )}
            </div>

            <nav className="flex flex-col p-4">
              {CATEGORIES.map((category) => (
                <Link
                  key={category.name}
                  href={category.href}
                  className="border-b py-4 text-base font-medium hover:text-blue-600"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

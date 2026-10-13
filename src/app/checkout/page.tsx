import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CreditCard, ShoppingBag, ArrowLeft } from 'lucide-react';
import CheckoutForm, { type CheckoutItem } from '@/components/checkout/CheckoutForm';

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string; quantity?: string }>;
}) {
  const { productId, quantity } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?error=' + encodeURIComponent('주문 및 결제를 진행하시려면 먼저 로그인해 주세요.'));
  }

  // 사용자 프로필 정보 조회
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('id', user.id)
    .maybeSingle();

  const userProfile = {
    id: user.id,
    name: profile?.name || user.user_metadata?.name || '',
    email: user.email || '',
  };

  let checkoutItems: CheckoutItem[] = [];

  // 1. 단일 상품 "바로 구매하기"인 경우
  if (productId) {
    const qty = parseInt(quantity || '1', 10);
    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .maybeSingle();

    if (product) {
      checkoutItems = [
        {
          productId: product.id,
          title: product.title,
          price: product.price,
          quantity: Math.max(1, qty),
          image: product.images?.[0] || '/cap-superdry.png',
          is_bundle_1plus1: product.is_bundle_1plus1,
        },
      ];
    }
  } else {
    // 2. 장바구니 전체 주문인 경우
    const { data: cartData } = await supabase
      .from('cart')
      .select(`
        id,
        product_id,
        quantity,
        product:products (*)
      `)
      .eq('user_id', user.id);

    if (cartData && cartData.length > 0) {
      // PostgREST 관계 캐시 대비 Fallback
      if (cartData[0]?.product) {
        checkoutItems = cartData
          .filter((c: any) => c.product)
          .map((c: any) => ({
            productId: c.product.id,
            title: c.product.title,
            price: c.product.price,
            quantity: c.quantity,
            image: c.product.images?.[0] || '/cap-superdry.png',
            is_bundle_1plus1: c.product.is_bundle_1plus1,
          }));
      } else {
        const productIds = cartData.map((c: any) => c.product_id).filter(Boolean);
        const { data: products } = await supabase.from('products').select('*').in('id', productIds);
        const productMap = new Map((products || []).map((p: any) => [p.id, p]));

        checkoutItems = cartData
          .map((c: any) => {
            const p = productMap.get(c.product_id);
            if (!p) return null;
            return {
              productId: p.id,
              title: p.title,
              price: p.price,
              quantity: c.quantity,
              image: p.images?.[0] || '/cap-superdry.png',
              is_bundle_1plus1: p.is_bundle_1plus1,
            };
          })
          .filter(Boolean) as CheckoutItem[];
      }
    }
  }

  if (checkoutItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center max-w-md">
        <div className="w-16 h-16 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">주문할 상품이 없습니다</h1>
        <p className="text-sm text-gray-500 mb-8">
          장바구니에 상품을 담거나 원하시는 모자를 먼저 선택해 주세요.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/cart"
            className="bg-black hover:bg-gray-800 text-white font-bold px-6 py-3.5 rounded-xl transition-colors"
          >
            장바구니로 가기
          </Link>
          <Link
            href="/"
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-6 py-3.5 rounded-xl transition-colors"
          >
            쇼핑 계속하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="border-b pb-6 mb-8 flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 flex items-center gap-2.5">
            <CreditCard className="w-7 h-7" /> 주문 및 결제
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            배송지 정보를 확인하고 원하시는 결제 수단으로 안전하게 결제하세요.
          </p>
        </div>
        <Link href="/cart" className="text-xs text-gray-500 hover:text-black flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> 장바구니로 돌아가기
        </Link>
      </div>

      <CheckoutForm initialItems={checkoutItems} userProfile={userProfile} />
    </div>
  );
}

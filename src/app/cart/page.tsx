import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import CartView from '@/components/cart/CartView';

export default async function CartPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-24 text-center max-w-md">
        <div className="w-16 h-16 bg-gray-100 text-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">로그인이 필요합니다</h1>
        <p className="text-sm text-gray-500 mb-8">
          장바구니에 담긴 상품을 확인하고 주문하시려면 먼저 로그인해 주세요.
        </p>
        <Link
          href="/login"
          className="inline-block w-full bg-black hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm"
        >
          로그인하러 가기
        </Link>
      </div>
    );
  }

  // 장바구니 상품 목록 조회 (Join products)
  const { data: cartData, error } = await supabase
    .from('cart')
    .select(`
      id,
      product_id,
      quantity,
      created_at,
      product:products (*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  let cartItems: any[] = [];
  if (cartData && cartData.length > 0) {
    if (cartData[0]?.product) {
      cartItems = cartData;
    } else {
      // PostgREST 관계 캐시가 아직 동기화되지 않은 경우를 위한 안전한 Fallback
      const productIds = cartData.map((c: any) => c.product_id).filter(Boolean);
      const { data: products } = await supabase.from('products').select('*').in('id', productIds);
      const productMap = new Map((products || []).map((p: any) => [p.id, p]));
      cartItems = cartData.map((c: any) => ({
        ...c,
        product: productMap.get(c.product_id) || null,
      }));
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="border-b pb-6 mb-8 flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 flex items-center gap-2.5">
            <ShoppingBag className="w-7 h-7" /> 장바구니
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            선택하신 상품 목록과 결제 예정 금액을 확인하실 수 있습니다.
          </p>
        </div>
        <span className="text-sm font-semibold text-gray-500">
          총 <strong className="text-black">{cartItems.length}</strong>종류
        </span>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm mb-6">
          💡 Supabase에 <code>cart</code> 테이블이 아직 생성되지 않았습니다. 안내된 SQL 스키마를 실행해 주세요!
        </div>
      )}

      <CartView initialItems={cartItems} />
    </div>
  );
}

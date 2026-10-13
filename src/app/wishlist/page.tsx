import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import WishlistButton from '@/components/ui/WishlistButton';
import AddToCartButton from '@/components/ui/AddToCartButton';

export default async function WishlistPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-24 text-center max-w-md">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Heart className="w-8 h-8 fill-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">로그인이 필요합니다</h1>
        <p className="text-sm text-gray-500 mb-8">
          찜한 상품을 확인하고 관리하시려면 먼저 로그인해 주세요.
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

  // 찜한 목록과 상품 정보 조회 (Join)
  const { data: wishlistItems, error } = await supabase
    .from('wishlists')
    .select(`
      id,
      created_at,
      product:products (*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="border-b pb-6 mb-8 flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
            <Heart className="w-7 h-7 fill-red-500 text-red-500" /> 찜한 상품 (위시리스트)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            고객님께서 하트를 눌러 찜해두신 모자 상품 목록입니다.
          </p>
        </div>
        <span className="text-sm font-semibold text-gray-500">
          총 <strong className="text-red-600">{wishlistItems?.length || 0}</strong>개
        </span>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm mb-6">
          💡 Supabase에 <code>wishlists</code> 테이블이 아직 생성되지 않았습니다. 안내된 SQL을 실행해 주세요!
        </div>
      )}

      {wishlistItems && wishlistItems.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {wishlistItems.map((item: any) => {
            const product = item.product;
            if (!product) return null;

            const imgSrc = product.images?.[0] || '/cap-superdry.png';

            return (
              <div 
                key={item.id} 
                className="group bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-square bg-gray-50 overflow-hidden">
                    {product.is_bundle_1plus1 && (
                      <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-md z-10">
                        1+1
                      </span>
                    )}
                    {/* Action Buttons on Image */}
                    <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
                      <WishlistButton productId={product.id} initialIsLiked={true} size={18} />
                      <AddToCartButton productId={product.id} size="sm" />
                    </div>

                    <Link href={`/product/${product.id}`} className="block w-full h-full relative">
                      <Image
                        src={imgSrc}
                        alt={product.title}
                        fill
                        className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>
                  </div>

                  <div className="p-4">
                    <Link href={`/product/${product.id}`}>
                      <h2 className="font-semibold text-gray-900 text-sm group-hover:underline line-clamp-2">
                        {product.title}
                      </h2>
                    </Link>
                    <p className="text-base font-extrabold text-black mt-2">
                      {product.price.toLocaleString()}원
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0 space-y-2">
                  <AddToCartButton 
                    productId={product.id} 
                    variant="subtle" 
                    text="장바구니 담기" 
                  />
                  <Link
                    href={`/product/${product.id}`}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    상세보기
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24 bg-gray-50 rounded-2xl border border-dashed border-gray-300 max-w-xl mx-auto">
          <div className="w-16 h-16 bg-white text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Heart className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-gray-700 mb-1">아직 찜한 상품이 없습니다</h2>
          <p className="text-sm text-gray-400 mb-6">
            모자 상품 사진의 하트(찜) 버튼을 눌러 관심 상품을 모아보세요!
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-black hover:bg-gray-800 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all shadow-sm"
          >
            모자 둘러보러 가기 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

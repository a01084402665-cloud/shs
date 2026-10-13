import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';
import Link from 'next/link';
import WishlistButton from '@/components/ui/WishlistButton';
import AddToCartButton from '@/components/ui/AddToCartButton';
import { getUserWishlistProductIds } from '@/app/actions/wishlist';

export default async function PromotionPage() {
  const supabase = await createClient();
  const wishlistedIds = await getUserWishlistProductIds();

  // 1+1 기획전 상품 조회
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
    .eq('is_bundle_1plus1', true)
    .order('created_at', { ascending: false });

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="border-b pb-6 mb-8 flex items-baseline justify-between">
        <div>
          <span className="text-red-600 font-extrabold text-sm tracking-wider uppercase">
            SPECIAL EVENT
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mt-1">
            🎉 1+1 특별 기획전
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            하나 사면 하나 더! 모든 모자 교차 선택 가능한 기간 한정 1+1 기획전입니다.
          </p>
        </div>
        <span className="text-sm font-semibold text-gray-500">
          총 <strong className="text-red-600">{products?.length || 0}</strong>개
        </span>
      </div>

      {products && products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((item) => {
            const imgSrc = item.images?.[0] || '/cap-superdry.png';
            const isLiked = wishlistedIds.includes(String(item.id));

            return (
              <div
                key={item.id}
                className="group bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-square bg-gray-50 overflow-hidden">
                    <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-md z-10">
                      1+1
                    </span>

                    {/* Image Action Buttons */}
                    <div className="absolute top-2.5 right-2.5 z-20 flex flex-col gap-1.5">
                      <WishlistButton
                        productId={String(item.id)}
                        initialIsLiked={isLiked}
                        size={18}
                      />
                      <AddToCartButton
                        productId={String(item.id)}
                        size="sm"
                      />
                    </div>

                    <Link href={`/product/${item.id}`} className="block w-full h-full relative">
                      <Image
                        src={imgSrc}
                        alt={item.title}
                        fill
                        className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>
                  </div>

                  <div className="p-4">
                    <Link href={`/product/${item.id}`}>
                      <h2 className="font-semibold text-gray-900 text-sm group-hover:underline line-clamp-2">
                        {item.title}
                      </h2>
                    </Link>
                    <p className="text-base font-extrabold text-red-600 mt-2">
                      {item.price.toLocaleString()}원
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <AddToCartButton
                    productId={String(item.id)}
                    variant="subtle"
                    text="장바구니 담기"
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24 bg-gray-50 rounded-2xl border border-dashed border-gray-300 max-w-xl mx-auto">
          <p className="text-gray-500 font-medium">현재 진행 중인 1+1 상품이 없습니다.</p>
        </div>
      )}
    </div>
  );
}

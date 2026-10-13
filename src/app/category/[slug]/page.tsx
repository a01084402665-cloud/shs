import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';
import Link from 'next/link';
import WishlistButton from '@/components/ui/WishlistButton';
import AddToCartButton from '@/components/ui/AddToCartButton';
import { getUserWishlistProductIds } from '@/app/actions/wishlist';

const CATEGORY_NAMES: Record<string, string> = {
  new: '신상품 (NEW)',
  best: '베스트 (BEST)',
  ballcap: '볼캡 (Ball Cap)',
  buckethat: '버킷햇 (Bucket Hat)',
  beanie: '비니 (Beanie)',
  etc: '기타 모자 (ETC)',
};

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categoryTitle = CATEGORY_NAMES[slug] || `${slug.toUpperCase()} 모자`;

  const supabase = await createClient();
  const wishlistedIds = await getUserWishlistProductIds();

  // 상품 목록 조회
  let query = supabase.from('products').select('*').eq('status', 'active');

  if (slug === 'best') {
    query = query.order('price', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data: products } = await query;

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="border-b pb-6 mb-8 flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
            {categoryTitle}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            트렌디하고 감각적인 다써바 {categoryTitle} 라인업입니다.
          </p>
        </div>
        <span className="text-sm font-semibold text-gray-500">
          총 <strong className="text-black">{products?.length || 0}</strong>개
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
                    {item.is_bundle_1plus1 && (
                      <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-md z-10">
                        1+1
                      </span>
                    )}

                    {/* Image Action Buttons: Wishlist & AddToCart */}
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
                    <p className="text-base font-extrabold text-black mt-2">
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
          <p className="text-gray-500 font-medium">등록된 상품이 없습니다.</p>
        </div>
      )}
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import WishlistButton from '@/components/ui/WishlistButton';
import AddToCartButton from '@/components/ui/AddToCartButton';

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">상품을 찾을 수 없습니다</h1>
        <Link href="/" className="text-blue-600 hover:underline">
          메인 페이지로 돌아가기
        </Link>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  let isWishlisted = false;
  if (user) {
    const { data: wish } = await supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', product.id)
      .maybeSingle();
    isWishlisted = !!wish;
  }

  const imgSrc = product.images?.[0] || '/cap-superdry.png';

  return (
    <div className="container mx-auto px-4 py-10">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black mb-8">
        <ArrowLeft className="w-4 h-4" /> 뒤로가기
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start max-w-5xl mx-auto">
        {/* Product Image */}
        <div className="bg-gray-50 aspect-square rounded-2xl overflow-hidden relative shadow-inner">
          {product.is_bundle_1plus1 && (
            <div className="absolute top-4 left-4 bg-red-600 text-white font-bold px-3 py-1 rounded-full text-xs z-10">
              1+1 기획전
            </div>
          )}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            <WishlistButton productId={product.id} initialIsLiked={isWishlisted} size={22} />
            <AddToCartButton productId={product.id} size="md" />
          </div>
          <Image
            src={imgSrc}
            alt={product.title}
            fill
            className="object-contain p-8"
            priority
          />
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-2">
            HAT SPECIALIST SHOP
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            {product.title}
          </h1>

          <div className="text-3xl font-extrabold text-gray-900 mb-6">
            {product.price.toLocaleString()}원
          </div>

          <div className="border-t border-b py-6 my-4 space-y-3 text-sm text-gray-600">
            <div className="flex justify-between">
              <span className="text-gray-400">배송정보</span>
              <span>무료배송 (CJ대한통운 / 2일 이내 출고)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">혜택안내</span>
              <span>신규 회원 3,000P 즉시 지급</span>
            </div>
            {product.is_bundle_1plus1 && (
              <div className="flex justify-between font-semibold text-red-600">
                <span>프로모션</span>
                <span>1+1 이벤트 적용 대상 상품</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 items-center">
            <div className="border-2 border-gray-200 rounded-xl p-2.5 hover:border-red-300 transition-colors shrink-0">
              <WishlistButton productId={product.id} initialIsLiked={isWishlisted} size={24} />
            </div>
            <AddToCartButton 
              productId={product.id} 
              variant="outline" 
              size="lg" 
              className="flex-1" 
              text="장바구니 담기" 
            />
            <Link
              href={`/checkout?productId=${product.id}&quantity=1`}
              className="flex-1 bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-colors text-center"
            >
              바로 구매하기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

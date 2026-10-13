import Link from 'next/link';
import Image from 'next/image';
import WishlistButton from '@/components/ui/WishlistButton';
import AddToCartButton from '@/components/ui/AddToCartButton';

interface ProductItem {
  id: string | number;
  title?: string;
  name?: string;
  price: number | string;
  images?: string[];
  image?: string;
  is_bundle_1plus1?: boolean;
}

const FALLBACK_ITEMS: ProductItem[] = [
  { id: '1', title: 'Superdry 빈티지 데님 볼캡', price: 39900, images: ['/cap-superdry.png'] },
  { id: '2', title: 'Kodak 블루 워싱 볼캡', price: 35000, images: ['/cap-kodak.png'] },
  { id: '3', title: 'Customellow 베이지 코튼 볼캡', price: 42000, images: ['/cap-customellow.png'] },
  { id: '4', title: 'Superdry 빈티지 데님 볼캡 (Black)', price: 39900, images: ['/cap-superdry.png'] },
];

export default function PromotionSection({ 
  products, 
  wishlistedIds = [] 
}: { 
  products?: ProductItem[];
  wishlistedIds?: string[];
}) {
  const displayItems = products && products.length > 0 ? products : FALLBACK_ITEMS;

  return (
    <section className="py-16 bg-red-50">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-red-600">
          🎉 1+1 특별 기획전
        </h2>
        <p className="text-gray-600 mb-8">
          하나 사면 하나 더! 교차 선택 가능
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {displayItems.map((item) => {
            const itemTitle = item.title || item.name || '모자 상품';
            const itemPrice = typeof item.price === 'number' ? `${item.price.toLocaleString()}원` : item.price;
            const imgSrc = (item.images && item.images[0]) || item.image || '/cap-superdry.png';

            return (
              <Link href={`/product/${item.id}`} key={item.id} className="group block text-left">
                <div className="bg-white aspect-square rounded-lg mb-4 overflow-hidden relative shadow-sm">
                  <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded z-10">
                    1+1
                  </div>
                  <div className="absolute top-2.5 right-2.5 z-20 flex flex-col gap-1.5">
                    <WishlistButton 
                      productId={String(item.id)} 
                      initialIsLiked={wishlistedIds.includes(String(item.id))} 
                      size={18}
                    />
                    <AddToCartButton 
                      productId={String(item.id)} 
                      size="sm" 
                    />
                  </div>
                  <div className="w-full h-full relative group-hover:scale-105 transition-transform duration-300">
                    <Image
                      src={imgSrc}
                      alt={itemTitle}
                      fill
                      className="object-contain p-4"
                    />
                  </div>
                </div>
                <h3 className="font-medium text-gray-900 group-hover:underline line-clamp-1">
                  {itemTitle}
                </h3>
                <p className="text-red-600 font-bold mt-1">{itemPrice}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

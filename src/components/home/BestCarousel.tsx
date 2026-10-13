import Link from 'next/link';
import Image from 'next/image';
import WishlistButton from '@/components/ui/WishlistButton';
import AddToCartButton from '@/components/ui/AddToCartButton';

interface ProductItem {
  id: string | number;
  title?: string;
  price: number | string;
  images?: string[];
}

export default function BestCarousel({ 
  products, 
  wishlistedIds = [] 
}: { 
  products?: ProductItem[];
  wishlistedIds?: string[];
}) {
  const displayItems = products && products.length > 0 ? products : [];

  return (
    <section className="py-16 container mx-auto px-4">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl md:text-3xl font-bold">BEST ITEM</h2>
        <Link href="/category/best" className="text-sm text-gray-500 hover:text-black hover:underline">
          전체보기 &gt;
        </Link>
      </div>

      {/* Horizontal Scroll Area */}
      <div className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory hide-scrollbar">
        {displayItems.map((item, index) => {
          const imgSrc = item.images && item.images.length > 0 ? item.images[0] : '/cap-superdry.png';
          const itemPrice = typeof item.price === 'number' ? `${item.price.toLocaleString()}원` : item.price;

          return (
            <Link 
              href={`/product/${item.id}`} 
              key={item.id} 
              className="group min-w-[200px] md:min-w-[250px] snap-start"
            >
              <div className="bg-gray-100 aspect-square rounded-lg mb-4 overflow-hidden relative">
                <div className="absolute top-2 right-2 z-20 flex flex-col gap-1.5">
                  <WishlistButton 
                    productId={String(item.id)} 
                    initialIsLiked={wishlistedIds.includes(String(item.id))} 
                    size={16} 
                  />
                  <AddToCartButton 
                    productId={String(item.id)} 
                    size="sm" 
                  />
                </div>
                <Image
                  src={imgSrc}
                  alt={item.title || '베스트 상품'}
                  fill
                  className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="text-sm font-bold text-gray-500 mb-1">BEST 0{index + 1}</div>
              <h3 className="font-medium text-gray-900 group-hover:underline line-clamp-2">
                {item.title}
              </h3>
              <p className="font-bold mt-1 text-black">{itemPrice}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

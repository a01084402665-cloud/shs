import MainBanner from "@/components/home/MainBanner";
import PromotionSection from "@/components/home/PromotionSection";
import BestCarousel from "@/components/home/BestCarousel";
import FloatingButton from "@/components/ui/FloatingButton";
import { createClient } from "@/lib/supabase/server";
import { getUserWishlistProductIds } from "@/app/actions/wishlist";

export default async function Home() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  const wishlistedIds = await getUserWishlistProductIds();
  const promoProducts = products?.filter((p) => p.is_bundle_1plus1) || [];

  return (
    <>
      <MainBanner />
      <PromotionSection 
        products={promoProducts.length > 0 ? promoProducts : (products || [])} 
        wishlistedIds={wishlistedIds}
      />
      <BestCarousel 
        products={products || []} 
        wishlistedIds={wishlistedIds}
      />
      <FloatingButton />
    </>
  );
}

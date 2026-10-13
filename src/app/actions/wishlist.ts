'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function toggleWishlist(productId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, requireLogin: true, message: '로그인이 필요한 서비스입니다.' };
  }

  // 1. 이미 찜했는지 확인
  const { data: existing, error: checkError } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle();

  if (checkError) {
    console.error('Check wishlist error:', checkError);
    return { 
      success: false, 
      error: checkError.message,
      message: '찜 테이블을 Supabase에서 생성해 주세요. (SQL 실행 필요)'
    };
  }

  if (existing) {
    // 2. 이미 존재하면 삭제 (찜 취소)
    const { error: deleteError } = await supabase
      .from('wishlists')
      .delete()
      .eq('id', existing.id);

    if (deleteError) {
      console.error('Delete wishlist error:', deleteError);
      return { success: false, error: deleteError.message };
    }

    revalidatePath('/wishlist');
    revalidatePath('/');
    return { success: true, isLiked: false };
  } else {
    // 3. 없으면 추가 (찜 등록)
    const { error: insertError } = await supabase
      .from('wishlists')
      .insert({
        user_id: user.id,
        product_id: productId,
      });

    if (insertError) {
      console.error('Insert wishlist error:', insertError);
      return { success: false, error: insertError.message };
    }

    revalidatePath('/wishlist');
    revalidatePath('/');
    return { success: true, isLiked: true };
  }
}

export async function getUserWishlistProductIds() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: list, error } = await supabase
    .from('wishlists')
    .select('product_id')
    .eq('user_id', user.id);

  if (error || !list) {
    return [];
  }

  return list.map((item) => item.product_id);
}

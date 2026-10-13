'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * 장바구니에 상품 추가
 */
export async function addToCart(productId: string, quantity: number = 1) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, requireLogin: true, message: '로그인이 필요한 서비스입니다.' };
  }

  // 1. 이미 장바구니에 담긴 상품인지 확인
  const { data: existing, error: checkError } = await supabase
    .from('cart')
    .select('id, quantity')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle();

  if (checkError) {
    console.error('Check cart error:', checkError);
    return { 
      success: false, 
      error: checkError.message,
      message: '장바구니 테이블을 Supabase에서 생성해 주세요. (SQL 실행 필요)'
    };
  }

  if (existing) {
    // 2. 이미 존재하면 수량 증가
    const newQuantity = (existing.quantity || 1) + quantity;
    const { error: updateError } = await supabase
      .from('cart')
      .update({ quantity: newQuantity })
      .eq('id', existing.id);

    if (updateError) {
      console.error('Update cart quantity error:', updateError);
      return { success: false, error: updateError.message };
    }

    revalidatePath('/cart');
    revalidatePath('/');
    return { 
      success: true, 
      message: `장바구니 수량이 ${newQuantity}개로 변경되었습니다.`,
      quantity: newQuantity
    };
  } else {
    // 3. 없으면 신규 추가
    const { error: insertError } = await supabase
      .from('cart')
      .insert({
        user_id: user.id,
        product_id: productId,
        quantity: Math.max(1, quantity),
      });

    if (insertError) {
      console.error('Insert cart error:', insertError);
      return { success: false, error: insertError.message };
    }

    revalidatePath('/cart');
    revalidatePath('/');
    return { 
      success: true, 
      message: '장바구니에 상품이 성공적으로 담겼습니다.',
      quantity
    };
  }
}

/**
 * 장바구니 수량 변경
 */
export async function updateCartQuantity(cartId: string, quantity: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, requireLogin: true };
  }

  if (quantity <= 0) {
    return removeFromCart(cartId);
  }

  const { error } = await supabase
    .from('cart')
    .update({ quantity })
    .eq('id', cartId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Update cart error:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/cart');
  return { success: true };
}

/**
 * 장바구니에서 삭제
 */
export async function removeFromCart(cartId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, requireLogin: true };
  }

  const { error } = await supabase
    .from('cart')
    .delete()
    .eq('id', cartId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Remove cart item error:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/cart');
  revalidatePath('/');
  return { success: true };
}

/**
 * 장바구니 전체 비우기
 */
export async function clearCart() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, requireLogin: true };
  }

  const { error } = await supabase
    .from('cart')
    .delete()
    .eq('user_id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/cart');
  revalidatePath('/');
  return { success: true };
}

/**
 * 장바구니에 담긴 총 수량 조회
 */
export async function getCartCount(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return 0;
  }

  const { data, error } = await supabase
    .from('cart')
    .select('quantity')
    .eq('user_id', user.id);

  if (error || !data) {
    return 0;
  }

  return data.reduce((sum, item) => sum + (item.quantity || 1), 0);
}

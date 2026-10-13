'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createProduct(formData: FormData) {
  const supabase = await createClient()

  const title = formData.get('title') as string
  const price = parseInt(formData.get('price') as string, 10)
  const is_bundle_1plus1 = formData.get('is_bundle_1plus1') === 'on'
  const imageFile = formData.get('image') as File | null

  let imageUrl = ''
  
  // 이미지 파일이 업로드 된 경우 Supabase Storage에 저장
  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(fileName, imageFile)
      
    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error('이미지 업로드 실패: ' + uploadError.message)
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(fileName)
      
    imageUrl = publicUrl
  }

  const { error } = await supabase.from('products').insert({
    title,
    price,
    is_bundle_1plus1,
    images: imageUrl ? [imageUrl] : [],
    status: 'active'
  })

  if (error) {
    console.error('Error creating product:', error)
    throw new Error('상품 등록 실패: ' + error.message)
  }

  revalidatePath('/admin/products')
  revalidatePath('/')
  redirect('/admin/products')
}

export async function updateProduct(formData: FormData) {
  const supabase = await createClient()

  const id = formData.get('id') as string
  const title = formData.get('title') as string
  const price = parseInt(formData.get('price') as string, 10)
  const is_bundle_1plus1 = formData.get('is_bundle_1plus1') === 'on'
  const status = formData.get('status') as string
  const imageFile = formData.get('image') as File | null
  const existingImageUrl = formData.get('existing_image') as string

  let imageUrl = existingImageUrl
  
  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(fileName, imageFile)
      
    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error('이미지 업로드 실패: ' + uploadError.message)
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(fileName)
      
    imageUrl = publicUrl
  }

  const { error } = await supabase.from('products').update({
    title,
    price,
    is_bundle_1plus1,
    images: imageUrl ? [imageUrl] : [],
    status
  }).eq('id', id)

  if (error) {
    console.error('Error updating product:', error)
    throw new Error('상품 수정 실패: ' + error.message)
  }

  revalidatePath('/admin/products')
  revalidatePath('/')
  redirect('/admin/products')
}

export async function deleteProduct(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('products').delete().eq('id', id)

  if (error) {
    console.error('Error deleting product:', error)
    throw new Error('상품 삭제 실패: ' + error.message)
  }

  revalidatePath('/admin/products')
  revalidatePath('/')
}

// ==================== 주문 / 배송 관리 Actions ====================

export async function updateOrderStatus(orderId: string, status: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)

  if (error) {
    console.error('Error updating order status:', error)
    throw new Error('주문 상태 변경 실패: ' + error.message)
  }

  revalidatePath('/admin/orders')
  revalidatePath('/admin/tax-invoices')
}

export async function cancelAndRefundOrder(orderId: string, cancelReason: string = '관리자 결제 취소 및 환불') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('로그인이 필요합니다.')
  }

  // 관리자 권한 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin' || profile?.name === '형석' || user.user_metadata?.role === 'admin'
  if (!isAdmin) {
    throw new Error('관리자 권한이 없습니다.')
  }

  // 주문 정보 조회
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    throw new Error('주문을 찾을 수 없습니다.')
  }

  // PG 결제 키가 존재하는 경우 토스페이먼츠 공식 취소 API 호출
  if (order.payment_key) {
    const secretKey = process.env.TOSS_SECRET_KEY || 'test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6'
    const basicAuth = Buffer.from(`${secretKey}:`).toString('base64')

    const cancelResponse = await fetch(`https://api.tosspayments.com/v1/payments/${order.payment_key}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cancelReason,
      }),
    })

    const cancelData = await cancelResponse.json()

    if (!cancelResponse.ok) {
      console.error('Toss Payments cancel error:', cancelData)
      throw new Error(`토스페이먼츠 환불 실패: ${cancelData.message || cancelData.code}`)
    }
  }

  // DB 주문 상태 갱신
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'refunded',
      cancelled_at: new Date().toISOString(),
      cancel_reason: cancelReason,
    })
    .eq('id', orderId)

  if (updateError) {
    throw new Error('주문 환불 상태 업데이트 실패: ' + updateError.message)
  }

  revalidatePath('/admin/orders')
  revalidatePath('/mypage')
}

export async function updateOrderTracking(formData: FormData) {
  const supabase = await createClient()

  const id = formData.get('id') as string
  const carrier = formData.get('carrier') as string
  const tracking_number = formData.get('tracking_number') as string
  const status = formData.get('status') as string || 'shipped'

  const { error } = await supabase
    .from('orders')
    .update({
      carrier,
      tracking_number,
      status,
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating tracking:', error)
    throw new Error('배송 정보 등록 실패: ' + error.message)
  }

  revalidatePath('/admin/orders')
  redirect('/admin/orders')
}

export async function createOrder(formData: FormData) {
  const supabase = await createClient()

  const customer_name = formData.get('customer_name') as string
  const customer_phone = formData.get('customer_phone') as string
  const address = formData.get('address') as string
  const product_title = formData.get('product_title') as string
  const quantity = parseInt(formData.get('quantity') as string || '1', 10)
  const unit_price = parseInt(formData.get('unit_price') as string || '0', 10)
  const total_amount = unit_price * quantity

  // 공급가액과 부가세 자동 계산 (10% 부가세 원단위 반올림)
  const supply_amount = Math.round(total_amount / 1.1)
  const vat_amount = total_amount - supply_amount

  const order_number = `ORD-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 900 + 100)}`

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number,
      customer_name,
      customer_phone,
      address,
      supply_amount,
      vat_amount,
      total_amount,
      status: 'paid',
    })
    .select()
    .single()

  if (orderError) {
    console.error('Error creating order:', orderError)
    throw new Error('주문 등록 실패: ' + orderError.message)
  }

  // 주문 상세 상품 등록
  const { error: itemError } = await supabase.from('order_items').insert({
    order_id: order.id,
    product_title,
    spec: formData.get('spec') as string || 'FREE',
    quantity,
    unit_price,
    supply_amount,
    vat_amount,
    total_amount,
  })

  if (itemError) {
    console.warn('Order item insert note:', itemError)
  }

  revalidatePath('/admin/orders')
  revalidatePath('/admin/tax-invoices')
  redirect('/admin/orders')
}

export async function deleteOrder(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('orders').delete().eq('id', id)
  if (error) {
    throw new Error('주문 삭제 실패: ' + error.message)
  }

  revalidatePath('/admin/orders')
  revalidatePath('/admin/tax-invoices')
}

// ==================== 원부자재 관리 Actions ====================

export async function createMaterial(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const code = formData.get('code') as string
  const unit = formData.get('unit') as string
  const unit_price = parseInt(formData.get('unit_price') as string || '0', 10)
  const current_stock = parseInt(formData.get('current_stock') as string || '0', 10)
  const safety_stock = parseInt(formData.get('safety_stock') as string || '0', 10)

  const { error } = await supabase.from('materials').insert({
    name,
    code,
    unit,
    unit_price,
    current_stock,
    safety_stock,
  })

  if (error) {
    console.error('Error creating material:', error)
    throw new Error('원부자재 등록 실패: ' + error.message)
  }

  revalidatePath('/admin/materials')
  redirect('/admin/materials')
}

export async function updateMaterialStock(id: string, amount: number) {
  const supabase = await createClient()

  // 현재 재고 조회
  const { data: material } = await supabase
    .from('materials')
    .select('current_stock')
    .eq('id', id)
    .single()

  const newStock = Math.max(0, (material?.current_stock || 0) + amount)

  const { error } = await supabase
    .from('materials')
    .update({ current_stock: newStock })
    .eq('id', id)

  if (error) {
    throw new Error('재고 수정 실패: ' + error.message)
  }

  revalidatePath('/admin/materials')
}

export async function deleteMaterial(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('materials').delete().eq('id', id)
  if (error) {
    throw new Error('원부자재 삭제 실패: ' + error.message)
  }

  revalidatePath('/admin/materials')
}

// ==================== 발주 관리 Actions ====================

export async function createPurchaseOrder(formData: FormData) {
  const supabase = await createClient()

  const supplier_name = formData.get('supplier_name') as string
  const material_id = (formData.get('material_id') as string) || null
  const material_name = formData.get('material_name') as string
  const quantity = parseInt(formData.get('quantity') as string || '1', 10)
  const unit_price = parseInt(formData.get('unit_price') as string || '0', 10)
  
  // 공급가액, 세액, 총액 계산
  const supply_amount = quantity * unit_price
  const vat_amount = Math.round(supply_amount * 0.1)
  const total_amount = supply_amount + vat_amount

  const order_number = `PO-${Date.now().toString().slice(-8)}`

  const { error } = await supabase.from('purchase_orders').insert({
    order_number,
    supplier_name,
    material_id,
    material_name,
    quantity,
    unit_price,
    supply_amount,
    vat_amount,
    total_amount,
    status: 'pending',
  })

  if (error) {
    console.error('Error creating purchase order:', error)
    throw new Error('발주서 등록 실패: ' + error.message)
  }

  revalidatePath('/admin/purchase-orders')
  revalidatePath('/admin/tax-invoices')
  redirect('/admin/purchase-orders')
}

export async function updatePurchaseOrderStatus(id: string, status: string, material_id?: string | null, quantity?: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('purchase_orders')
    .update({ status })
    .eq('id', id)

  if (error) {
    throw new Error('발주 상태 변경 실패: ' + error.message)
  }

  // 만약 입고완료(completed) 상태가 되었고 material_id가 있다면 해당 원부자재 재고 자동 증가
  if (status === 'completed' && material_id && quantity) {
    const { data: mat } = await supabase
      .from('materials')
      .select('current_stock')
      .eq('id', material_id)
      .single()

    if (mat) {
      await supabase
        .from('materials')
        .update({ current_stock: mat.current_stock + quantity })
        .eq('id', material_id)
      revalidatePath('/admin/materials')
    }
  }

  revalidatePath('/admin/purchase-orders')
  revalidatePath('/admin/tax-invoices')
}

export async function deletePurchaseOrder(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('purchase_orders').delete().eq('id', id)
  if (error) {
    throw new Error('발주 삭제 실패: ' + error.message)
  }

  revalidatePath('/admin/purchase-orders')
  revalidatePath('/admin/tax-invoices')
}


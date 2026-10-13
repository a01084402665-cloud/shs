import { updateProduct } from '@/app/admin/actions';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !product) {
    return notFound();
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-black">상품 수정</h1>
        <Link href="/admin/products" className="text-gray-500 hover:underline">취소</Link>
      </div>

      <form action={updateProduct} className="flex flex-col gap-6">
        <input type="hidden" name="id" value={product.id} />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">상품명</label>
          <input type="text" name="title" defaultValue={product.title} required className="w-full border rounded-md px-3 py-2 text-black" />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">가격 (원)</label>
          <input type="number" name="price" defaultValue={product.price} required min="0" className="w-full border rounded-md px-3 py-2 text-black" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">상품 대표 이미지 업로드</label>
          <input type="file" name="image" accept="image/*" className="w-full border rounded-md px-3 py-2 text-black bg-white" />
          
          {product.images?.[0] && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-500">현재 이미지:</span>
              <img src={product.images[0]} alt="Current" className="h-10 w-10 object-cover rounded" />
              <input type="hidden" name="existing_image" value={product.images[0]} />
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">새 파일을 선택하면 기존 이미지가 교체됩니다.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">판매 상태</label>
          <select name="status" defaultValue={product.status} className="w-full border rounded-md px-3 py-2 text-black">
            <option value="active">판매중</option>
            <option value="hidden">품절/숨김</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="is_bundle_1plus1" name="is_bundle_1plus1" defaultChecked={product.is_bundle_1plus1} className="w-4 h-4" />
          <label htmlFor="is_bundle_1plus1" className="text-sm font-medium text-gray-700">1+1 기획전 상품으로 설정</label>
        </div>

        <button type="submit" className="bg-black text-white px-4 py-3 rounded-md hover:bg-gray-800 font-bold mt-4">
          수정 저장하기
        </button>
      </form>
    </div>
  );
}

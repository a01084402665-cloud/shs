import { createProduct } from '@/app/admin/actions';
import Link from 'next/link';

export default function NewProductPage() {
  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-black">새 상품 등록</h1>
        <Link href="/admin/products" className="text-gray-500 hover:underline">취소</Link>
      </div>

      <form action={createProduct} className="flex flex-col gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">상품명</label>
          <input type="text" name="title" required className="w-full border rounded-md px-3 py-2 text-black" />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">가격 (원)</label>
          <input type="number" name="price" required min="0" className="w-full border rounded-md px-3 py-2 text-black" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">상품 대표 이미지 업로드</label>
          <input type="file" name="image" accept="image/*" className="w-full border rounded-md px-3 py-2 text-black bg-white" />
          <p className="text-xs text-gray-500 mt-1">파일을 선택하지 않으면 이미지가 없는 상태로 등록됩니다.</p>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="is_bundle_1plus1" name="is_bundle_1plus1" className="w-4 h-4" />
          <label htmlFor="is_bundle_1plus1" className="text-sm font-medium text-gray-700">1+1 기획전 상품으로 설정</label>
        </div>

        <button type="submit" className="bg-black text-white px-4 py-3 rounded-md hover:bg-gray-800 font-bold mt-4">
          등록하기
        </button>
      </form>
    </div>
  );
}

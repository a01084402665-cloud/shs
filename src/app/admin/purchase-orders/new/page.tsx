import { createPurchaseOrder } from '@/app/admin/actions';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function NewPurchaseOrderPage() {
  const supabase = await createClient();
  const { data: materials } = await supabase.from('materials').select('*').order('name');

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <div>
          <h1 className="text-xl font-bold text-gray-900">신규 협력사 발주서 작성</h1>
          <p className="text-xs text-gray-500 mt-1">
            원단 및 부자재 발주서를 생성하여 Supabase purchase_orders 테이블에 등록합니다.
          </p>
        </div>
        <Link href="/admin/purchase-orders" className="text-sm text-gray-500 hover:text-black hover:underline">
          취소
        </Link>
      </div>

      <form action={createPurchaseOrder} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">거래처 / 협력사명</label>
          <input 
            type="text" 
            name="supplier_name" 
            required 
            placeholder="예: (주)동대문텍스타일, 신안스냅상사" 
            className="w-full border rounded-lg px-3.5 py-2.5 text-sm text-black" 
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">발주 원부자재 선택</label>
          <input 
            type="text" 
            name="material_name" 
            required 
            placeholder="예: 14수 워싱 코튼 트윌 원단 (Black)" 
            className="w-full border rounded-lg px-3.5 py-2.5 text-sm text-black" 
            list="materials-list"
          />
          <datalist id="materials-list">
            {materials?.map((m) => (
              <option key={m.id} value={m.name} />
            ))}
          </datalist>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">발주 수량</label>
            <input 
              type="number" 
              name="quantity" 
              defaultValue={50} 
              min={1} 
              required 
              className="w-full border rounded-lg px-3.5 py-2.5 text-sm text-black" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">구매 단가 (원, VAT 별도)</label>
            <input 
              type="number" 
              name="unit_price" 
              defaultValue={4500} 
              min={0} 
              step={100} 
              required 
              className="w-full border rounded-lg px-3.5 py-2.5 text-sm text-black" 
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-xs text-blue-800">
          💡 입력한 수량과 단가를 바탕으로 **공급가액 = 수량 × 단가**, **부가가치세 = 공급가액 × 10%**, **합계금액**이 자동 계산되어 Supabase에 저장됩니다. 추후 세금계산서/명세서 출력 시 바로 인쇄할 수 있습니다.
        </div>

        <button 
          type="submit" 
          className="w-full bg-black hover:bg-gray-900 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm"
        >
          발주서 등록 및 Supabase 저장
        </button>
      </form>
    </div>
  );
}

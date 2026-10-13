import { createOrder } from '@/app/admin/actions';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function NewOrderPage() {
  const supabase = await createClient();
  const { data: products } = await supabase.from('products').select('*').order('title');

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <div>
          <h1 className="text-xl font-bold text-gray-900">신규 주문 수동 등록</h1>
          <p className="text-xs text-gray-500 mt-1">
            B2B 단체 주문 또는 전화/오프라인 주문을 Supabase orders 테이블에 등록합니다.
          </p>
        </div>
        <Link href="/admin/orders" className="text-sm text-gray-500 hover:text-black hover:underline">
          취소
        </Link>
      </div>

      <form action={createOrder} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">주문자명 / 상호명</label>
            <input 
              type="text" 
              name="customer_name" 
              required 
              placeholder="예: 홍길동 또는 (주)한국상사" 
              className="w-full border rounded-lg px-3.5 py-2.5 text-sm text-black" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">연락처</label>
            <input 
              type="text" 
              name="customer_phone" 
              required 
              placeholder="010-1234-5678" 
              className="w-full border rounded-lg px-3.5 py-2.5 text-sm text-black" 
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">배송지 주소</label>
          <input 
            type="text" 
            name="address" 
            required 
            placeholder="서울특별시 마포구 월드컵북로 123" 
            className="w-full border rounded-lg px-3.5 py-2.5 text-sm text-black" 
          />
        </div>

        <div className="border-t pt-4">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">주문 품목 선택</label>
          <input 
            type="text" 
            name="product_title" 
            required 
            placeholder="예: Superdry 빈티지 데님 볼캡 (Black)" 
            className="w-full border rounded-lg px-3.5 py-2.5 text-sm text-black" 
            list="product-list"
          />
          <datalist id="product-list">
            {products?.map((p) => (
              <option key={p.id} value={p.title} />
            ))}
          </datalist>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">규격 / 옵션</label>
            <input 
              type="text" 
              name="spec" 
              defaultValue="FREE" 
              className="w-full border rounded-lg px-3.5 py-2.5 text-sm text-black" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">수량 (개)</label>
            <input 
              type="number" 
              name="quantity" 
              defaultValue={1} 
              min={1} 
              required 
              className="w-full border rounded-lg px-3.5 py-2.5 text-sm text-black" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">단가 (원, VAT 포함)</label>
            <input 
              type="number" 
              name="unit_price" 
              defaultValue={39900} 
              min={0} 
              step={100} 
              required 
              className="w-full border rounded-lg px-3.5 py-2.5 text-sm text-black" 
            />
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg text-xs text-gray-600">
          💡 입력한 금액을 기준으로 **공급가액(10/11)** 및 **부가가치세(1/11)**가 Supabase에 자동 분리 계산되어 저장되며, 세금명세서 출력 시 실시간 반영됩니다.
        </div>

        <button 
          type="submit" 
          className="w-full bg-black hover:bg-gray-900 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm"
        >
          주문 저장 및 Supabase 등록
        </button>
      </form>
    </div>
  );
}

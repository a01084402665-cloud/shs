import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { updatePurchaseOrderStatus, deletePurchaseOrder } from '@/app/admin/actions';
import { FileText, Plus, Trash2, CheckCircle2 } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '발주요청', color: 'bg-yellow-100 text-yellow-800' },
  ordered: { label: '발주확정', color: 'bg-blue-100 text-blue-800' },
  completed: { label: '입고완료', color: 'bg-green-100 text-green-800' },
  cancelled: { label: '발주취소', color: 'bg-red-100 text-red-800' },
};

export default async function AdminPurchaseOrdersPage() {
  const supabase = await createClient();

  const { data: purchaseOrders, error } = await supabase
    .from('purchase_orders')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📝 협력사 발주 관리</h1>
          <p className="text-sm text-gray-500 mt-1">
            원단 및 부자재 외주 협력사 발주 대장입니다. 입고 완료 시 원부자재 재고가 자동 반영됩니다.
          </p>
        </div>
        <Link 
          href="/admin/purchase-orders/new" 
          className="bg-black text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> 신규 발주서 작성
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
          Supabase `purchase_orders` 테이블 조회 중 오류: {error.message}
        </div>
      )}

      {/* Purchase Orders Table */}
      <div className="bg-white shadow rounded-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 font-semibold text-gray-600">
              <tr>
                <th className="px-6 py-3.5 text-left">발주번호 / 일자</th>
                <th className="px-6 py-3.5 text-left">거래처 / 협력사명</th>
                <th className="px-6 py-3.5 text-left">발주 품목</th>
                <th className="px-6 py-3.5 text-right">수량</th>
                <th className="px-6 py-3.5 text-right">공급가액 / 세액</th>
                <th className="px-6 py-3.5 text-right">합계금액</th>
                <th className="px-6 py-3.5 text-center">진행 상태</th>
                <th className="px-6 py-3.5 text-center">세무 / 관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {purchaseOrders && purchaseOrders.length > 0 ? (
                purchaseOrders.map((po) => {
                  const statusInfo = STATUS_MAP[po.status] || { label: po.status, color: 'bg-gray-100 text-gray-700' };

                  return (
                    <tr key={po.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">{po.order_number || 'PO-AUTO'}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {new Date(po.created_at).toLocaleDateString('ko-KR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">
                        {po.supplier_name}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-800">
                        {po.material_name || '원부자재'}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900 whitespace-nowrap">
                        {po.quantity?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-xs text-gray-500 whitespace-nowrap">
                        <div>공급: {po.supply_amount?.toLocaleString() || (po.quantity * (po.unit_price || 0))?.toLocaleString()}원</div>
                        <div>세액: {po.vat_amount?.toLocaleString() || Math.round((po.supply_amount || 0) * 0.1)?.toLocaleString()}원</div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-blue-600 whitespace-nowrap">
                        {po.total_amount?.toLocaleString()}원
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <form action={async (formData: FormData) => {
                          'use server';
                          const newStatus = formData.get('status') as string;
                          await updatePurchaseOrderStatus(po.id, newStatus, po.material_id, po.quantity);
                        }} className="inline-block">
                          <select
                            name="status"
                            defaultValue={po.status}
                            onChange={(e) => e.target.form?.requestSubmit()}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer ${statusInfo.color}`}
                          >
                            <option value="pending">발주요청</option>
                            <option value="ordered">발주확정</option>
                            <option value="completed">입고완료 (재고반영)</option>
                            <option value="cancelled">발주취소</option>
                          </select>
                        </form>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/admin/tax-invoices/print?type=purchase&id=${po.id}`}
                            className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-md font-semibold transition-colors"
                            title="매입 세금계산서/명세서 출력"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            명세서
                          </Link>
                          <form action={async () => {
                            'use server';
                            await deletePurchaseOrder(po.id);
                          }}>
                            <button 
                              type="submit" 
                              className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                              title="삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <p className="text-base font-medium text-gray-600">등록된 발주 내역이 없습니다.</p>
                    <p className="text-xs text-gray-400 mt-1">상단의 [신규 발주서 작성] 버튼을 눌러 협력사 발주를 등록해 보세요.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { updateOrderStatus, deleteOrder, updateOrderTracking, cancelAndRefundOrder } from '@/app/admin/actions';
import { Truck, FileText, Plus, Trash2, RotateCcw } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '결제대기', color: 'bg-gray-100 text-gray-700' },
  paid: { label: '결제완료', color: 'bg-blue-100 text-blue-800' },
  preparing: { label: '배송준비', color: 'bg-yellow-100 text-yellow-800' },
  shipped: { label: '배송중', color: 'bg-purple-100 text-purple-800' },
  delivered: { label: '배송완료', color: 'bg-green-100 text-green-800' },
  cancelled: { label: '주문취소', color: 'bg-red-100 text-red-800' },
  refunded: { label: '환불완료', color: 'bg-pink-100 text-pink-800' },
};

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  
  // 주문 목록과 상세 상품 불러오기
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🚚 주문 및 배송 관리</h1>
          <p className="text-sm text-gray-500 mt-1">
            고객 주문 상태 변경, 운송장 번호 등록 및 실시간 세금명세서 출력이 가능합니다.
          </p>
        </div>
        <Link 
          href="/admin/orders/new" 
          className="bg-black text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> 수동 주문 등록
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
          Supabase `orders` 테이블 조회 중 문제가 발생했습니다: {error.message}
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white shadow rounded-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 font-semibold text-gray-600">
              <tr>
                <th className="px-6 py-3.5 text-left">주문번호 / 일시</th>
                <th className="px-6 py-3.5 text-left">주문자 / 연락처</th>
                <th className="px-6 py-3.5 text-left">주문 품목</th>
                <th className="px-6 py-3.5 text-right">총 결제금액</th>
                <th className="px-6 py-3.5 text-center">주문 상태</th>
                <th className="px-6 py-3.5 text-left">배송 정보 (택배사 / 송장)</th>
                <th className="px-6 py-3.5 text-center">세무 / 관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {orders && orders.length > 0 ? (
                orders.map((order) => {
                  const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-700' };
                  const firstItem = order.order_items?.[0];
                  const itemsCount = order.order_items?.length || 0;
                  const itemTitle = firstItem 
                    ? `${firstItem.product_title}${itemsCount > 1 ? ` 외 ${itemsCount - 1}건` : ''}` 
                    : '주문 상품';

                  return (
                    <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">{order.order_number}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {new Date(order.created_at).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{order.customer_name || '비회원'}</div>
                        <div className="text-xs text-gray-500">{order.customer_phone || '-'}</div>
                        <div className="text-xs text-gray-400 truncate max-w-[180px]" title={order.address || ''}>
                          {order.address || '주소 미입력'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{itemTitle}</div>
                        <div className="text-xs text-gray-400">
                          공급가: {order.supply_amount?.toLocaleString()}원 / 세액: {order.vat_amount?.toLocaleString()}원
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="font-bold text-gray-900">{order.total_amount?.toLocaleString()}원</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {order.payment_method || '무통장/수동'}
                        </div>
                        {order.receipt_url && (
                          <a
                            href={order.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-blue-600 hover:underline block mt-0.5"
                          >
                            영수증보기
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <form action={async (formData: FormData) => {
                          'use server';
                          const newStatus = formData.get('status') as string;
                          await updateOrderStatus(order.id, newStatus);
                        }} className="inline-block">
                          <select
                            name="status"
                            defaultValue={order.status}
                            onChange={(e) => e.target.form?.requestSubmit()}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer ${statusInfo.color}`}
                          >
                            <option value="pending">결제대기</option>
                            <option value="paid">결제완료</option>
                            <option value="preparing">배송준비</option>
                            <option value="shipped">배송중</option>
                            <option value="delivered">배송완료</option>
                            <option value="cancelled">주문취소</option>
                            <option value="refunded">환불완료</option>
                          </select>
                        </form>
                      </td>
                      <td className="px-6 py-4">
                        <form action={updateOrderTracking} className="flex flex-col gap-1.5 min-w-[200px]">
                          <input type="hidden" name="id" value={order.id} />
                          <div className="flex gap-1.5">
                            <select
                              name="carrier"
                              defaultValue={order.carrier || 'CJ대한통운'}
                              className="text-xs border rounded px-1.5 py-1 text-gray-700 bg-gray-50"
                            >
                              <option value="CJ대한통운">CJ대한통운</option>
                              <option value="한진택배">한진택배</option>
                              <option value="우체국택배">우체국택배</option>
                              <option value="로젠택배">로젠택배</option>
                              <option value="롯데택배">롯데택배</option>
                            </select>
                            <input
                              type="text"
                              name="tracking_number"
                              defaultValue={order.tracking_number || ''}
                              placeholder="송장번호 입력"
                              className="text-xs border rounded px-2 py-1 w-full text-black placeholder:text-gray-400"
                            >
                            </input>
                            <button
                              type="submit"
                              className="bg-gray-900 hover:bg-black text-white text-xs px-2 py-1 rounded shrink-0 font-medium"
                            >
                              저장
                            </button>
                          </div>
                        </form>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/admin/tax-invoices/print?type=order&id=${order.id}`}
                            className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded-md font-semibold transition-colors"
                            title="세금명세서 출력"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            명세서
                          </Link>
                          {['paid', 'preparing'].includes(order.status) && (
                            <form action={async () => {
                              'use server';
                              await cancelAndRefundOrder(order.id, '관리자 결제 취소 및 환불');
                            }}>
                              <button
                                type="submit"
                                className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 px-2.5 py-1.5 rounded-md font-semibold transition-colors"
                                title="토스페이먼츠 환불/취소"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                환불
                              </button>
                            </form>
                          )}
                          <form action={async () => {
                            'use server';
                            await deleteOrder(order.id);
                          }}>
                            <button 
                              type="submit" 
                              className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                              title="주문 삭제"
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
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <p className="text-base font-medium text-gray-600">등록된 주문 내역이 없습니다.</p>
                    <p className="text-xs text-gray-400 mt-1">상단의 [수동 주문 등록] 버튼을 눌러 테스트 주문을 등록해 보세요.</p>
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

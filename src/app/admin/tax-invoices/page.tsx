import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { FileText, Printer, ArrowRight } from 'lucide-react';

export default async function AdminTaxInvoicesPage() {
  const supabase = await createClient();

  // 1. 매출(주문) 데이터 조회
  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });

  // 2. 매입(원부자재 발주) 데이터 조회
  const { data: purchaseOrders } = await supabase
    .from('purchase_orders')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🧾 세금명세서 및 전자세금계산서 관리</h1>
        <p className="text-sm text-gray-500 mt-1">
          Supabase에 저장된 실제 주문 및 발주 데이터 기반으로 품목, 규격, 공급가액(10/11), 세액(10%)이 자동 계산된 표준 세금명세서를 출력합니다.
        </p>
      </div>

      {/* Section 1: 매출 세금명세서 (주문 기반) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b bg-red-50/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <h2 className="text-base font-bold text-gray-900">매출 세금명세서 / 영수증 (고객 주문 기준)</h2>
          </div>
          <span className="text-xs text-gray-500">총 {orders?.length || 0}건</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold text-xs">
              <tr>
                <th className="px-6 py-3.5 text-left">발행일자 / 주문번호</th>
                <th className="px-6 py-3.5 text-left">공급받는자 (고객/상호)</th>
                <th className="px-6 py-3.5 text-left">품목 및 규격</th>
                <th className="px-6 py-3.5 text-right">공급가액</th>
                <th className="px-6 py-3.5 text-right">세액 (부가세 10%)</th>
                <th className="px-6 py-3.5 text-right">합계금액</th>
                <th className="px-6 py-3.5 text-center">명세서 출력</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {orders && orders.length > 0 ? (
                orders.map((order) => {
                  const firstItem = order.order_items?.[0];
                  const itemTitle = firstItem ? firstItem.product_title : '모자 완제품';
                  const itemSpec = firstItem?.spec || 'FREE';
                  const supplyAmt = order.supply_amount || Math.round(order.total_amount / 1.1);
                  const vatAmt = order.vat_amount || (order.total_amount - supplyAmt);

                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">{order.order_number}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(order.created_at).toLocaleDateString('ko-KR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {order.customer_name || '일반 고객'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{itemTitle}</span>
                        <span className="text-xs text-gray-400 block">규격: {itemSpec}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-800 whitespace-nowrap">
                        {supplyAmt.toLocaleString()}원
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600 whitespace-nowrap">
                        {vatAmt.toLocaleString()}원
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-red-600 whitespace-nowrap">
                        {order.total_amount?.toLocaleString()}원
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <Link
                          href={`/admin/tax-invoices/print?type=order&id=${order.id}`}
                          className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          세금명세서 인쇄
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    주문 데이터가 없습니다. [주문/배송 관리]에서 주문을 먼저 등록해 주세요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: 매입 세금계산서 (협력사 발주 기반) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b bg-blue-50/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <h2 className="text-base font-bold text-gray-900">매입 세금계산서 / 거래명세서 (협력사 원부자재 발주 기준)</h2>
          </div>
          <span className="text-xs text-gray-500">총 {purchaseOrders?.length || 0}건</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold text-xs">
              <tr>
                <th className="px-6 py-3.5 text-left">발주번호 / 일자</th>
                <th className="px-6 py-3.5 text-left">공급자 (원부자재 거래처)</th>
                <th className="px-6 py-3.5 text-left">발주 품목 및 수량</th>
                <th className="px-6 py-3.5 text-right">공급가액</th>
                <th className="px-6 py-3.5 text-right">세액 (부가세 10%)</th>
                <th className="px-6 py-3.5 text-right">합계금액</th>
                <th className="px-6 py-3.5 text-center">명세서 출력</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {purchaseOrders && purchaseOrders.length > 0 ? (
                purchaseOrders.map((po) => {
                  const supplyAmt = po.supply_amount || (po.quantity * (po.unit_price || 0));
                  const vatAmt = po.vat_amount || Math.round(supplyAmt * 0.1);

                  return (
                    <tr key={po.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">{po.order_number || 'PO-AUTO'}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(po.created_at).toLocaleDateString('ko-KR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {po.supplier_name}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{po.material_name}</span>
                        <span className="text-xs text-gray-400 block">수량: {po.quantity?.toLocaleString()}개 (단가: {po.unit_price?.toLocaleString()}원)</span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-800 whitespace-nowrap">
                        {supplyAmt.toLocaleString()}원
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600 whitespace-nowrap">
                        {vatAmt.toLocaleString()}원
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-blue-600 whitespace-nowrap">
                        {po.total_amount?.toLocaleString()}원
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <Link
                          href={`/admin/tax-invoices/print?type=purchase&id=${po.id}`}
                          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          계산서 인쇄
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    발주 데이터가 없습니다. [협력사 발주 관리]에서 발주서를 먼저 등록해 주세요.
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

import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';
import PrintButton from './PrintButton';

export default async function TaxInvoicePrintPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; id?: string }>;
}) {
  const { type, id } = await searchParams;
  const supabase = await createClient();

  let invoiceData: {
    title: string;
    isSales: boolean;
    date: string;
    invoiceNumber: string;
    buyerName: string;
    buyerAddress: string;
    buyerPhone: string;
    items: Array<{
      month: string;
      day: string;
      name: string;
      spec: string;
      qty: number;
      unitPrice: number;
      supplyAmt: number;
      vatAmt: number;
      note: string;
    }>;
    totalSupply: number;
    totalVat: number;
    grandTotal: number;
  } | null = null;

  if (type === 'order' && id) {
    const { data: order } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .single();

    if (order) {
      const orderDate = new Date(order.created_at);
      const items = order.order_items && order.order_items.length > 0
        ? order.order_items.map((it: any) => ({
            month: String(orderDate.getMonth() + 1).padStart(2, '0'),
            day: String(orderDate.getDate()).padStart(2, '0'),
            name: it.product_title,
            spec: it.spec || 'FREE',
            qty: it.quantity || 1,
            unitPrice: it.unit_price || Math.round(it.total_amount / (it.quantity || 1)),
            supplyAmt: it.supply_amount || Math.round(it.total_amount / 1.1),
            vatAmt: it.vat_amount || (it.total_amount - Math.round(it.total_amount / 1.1)),
            note: '온라인 주문',
          }))
        : [{
            month: String(orderDate.getMonth() + 1).padStart(2, '0'),
            day: String(orderDate.getDate()).padStart(2, '0'),
            name: '모자 완제품',
            spec: 'FREE',
            qty: 1,
            unitPrice: order.total_amount,
            supplyAmt: order.supply_amount || Math.round(order.total_amount / 1.1),
            vatAmt: order.vat_amount || (order.total_amount - Math.round(order.total_amount / 1.1)),
            note: '온라인 주문',
          }];

      const totalSupply = items.reduce((sum: number, it: any) => sum + it.supplyAmt, 0);
      const totalVat = items.reduce((sum: number, it: any) => sum + it.vatAmt, 0);

      invoiceData = {
        title: '세 금 계 산 서 (공급받는자 보관용)',
        isSales: true,
        date: orderDate.toISOString().split('T')[0],
        invoiceNumber: order.order_number,
        buyerName: order.customer_name || '일반 소비자',
        buyerAddress: order.address || '배송지 주소',
        buyerPhone: order.customer_phone || '',
        items,
        totalSupply,
        totalVat,
        grandTotal: order.total_amount,
      };
    }
  } else if (type === 'purchase' && id) {
    const { data: po } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('id', id)
      .single();

    if (po) {
      const poDate = new Date(po.created_at);
      const supplyAmt = po.supply_amount || (po.quantity * (po.unit_price || 0));
      const vatAmt = po.vat_amount || Math.round(supplyAmt * 0.1);

      invoiceData = {
        title: '매 입 세 금 계 산 서 (공급자 보관용)',
        isSales: false,
        date: poDate.toISOString().split('T')[0],
        invoiceNumber: po.order_number || 'PO-AUTO',
        buyerName: '다써바 모자 (HAT SPECIALIST)',
        buyerAddress: '서울특별시 마포구 양화로 123 다써바 빌딩 3층',
        buyerPhone: '02-1234-5678',
        items: [{
          month: String(poDate.getMonth() + 1).padStart(2, '0'),
          day: String(poDate.getDate()).padStart(2, '0'),
          name: po.material_name || '원부자재',
          spec: '규격품',
          qty: po.quantity || 1,
          unitPrice: po.unit_price || 0,
          supplyAmt,
          vatAmt,
          note: po.supplier_name || '협력사 발주',
        }],
        totalSupply: supplyAmt,
        totalVat: vatAmt,
        grandTotal: po.total_amount || (supplyAmt + vatAmt),
      };
    }
  }

  if (!invoiceData) {
    return (
      <div className="container mx-auto p-12 text-center">
        <h1 className="text-xl font-bold mb-4">해당 세금명세서 데이터를 찾을 수 없습니다.</h1>
        <Link href="/admin/tax-invoices" className="text-blue-600 underline text-sm">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const themeBorder = invoiceData.isSales ? 'border-red-600 text-red-700' : 'border-blue-600 text-blue-700';
  const themeHeader = invoiceData.isSales ? 'bg-red-50 text-red-900 border-red-300' : 'bg-blue-50 text-blue-900 border-blue-300';
  const borderColor = invoiceData.isSales ? 'border-red-400' : 'border-blue-400';

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 print:p-0 print:bg-white text-black">
      {/* Top action bar - Hidden during print */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <Link
          href="/admin/tax-invoices"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> 세금명세서 목록으로
        </Link>
        <div className="flex gap-3">
          <PrintButton />
        </div>
      </div>

      {/* Tax Invoice Document - A4 Container */}
      <div className={`max-w-4xl mx-auto bg-white p-8 sm:p-12 shadow-md print:shadow-none print:p-0 border-2 ${invoiceData.isSales ? 'border-red-500' : 'border-blue-500'}`}>
        
        {/* Document Title Header */}
        <div className="text-center pb-6 border-b-2 border-dashed border-gray-300">
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-widest ${invoiceData.isSales ? 'text-red-600' : 'text-blue-600'}`}>
            {invoiceData.title}
          </h1>
          <div className="flex justify-between items-center mt-3 text-xs text-gray-600">
            <span>승인/관리번호: <strong className="font-mono text-gray-900">{invoiceData.invoiceNumber}</strong></span>
            <span>작성일자: <strong className="text-gray-900">{invoiceData.date}</strong></span>
          </div>
        </div>

        {/* Supplier & Receiver Info Grid */}
        <div className="grid grid-cols-2 mt-4 border-2 border-gray-800 text-xs">
          {/* 공급자 (Supplier) */}
          <div className="border-r border-gray-800">
            <div className="bg-gray-100 font-bold py-1.5 text-center border-b border-gray-800">
              공 급 자
            </div>
            <div className="grid grid-cols-4 divide-y divide-gray-300">
              <div className="p-2 font-semibold bg-gray-50 border-r border-gray-300">등록번호</div>
              <div className="col-span-3 p-2 font-mono font-bold">107-86-54321</div>

              <div className="p-2 font-semibold bg-gray-50 border-r border-gray-300">상 호</div>
              <div className="p-2 border-r border-gray-300">다써바 모자</div>
              <div className="p-2 font-semibold bg-gray-50 border-r border-gray-300">성 명</div>
              <div className="p-2">홍 길 동 (인)</div>

              <div className="p-2 font-semibold bg-gray-50 border-r border-gray-300">사업장주소</div>
              <div className="col-span-3 p-2">서울특별시 마포구 양화로 123, 다써바 타워 3층</div>

              <div className="p-2 font-semibold bg-gray-50 border-r border-gray-300">업 태</div>
              <div className="p-2 border-r border-gray-300">제조, 도소매</div>
              <div className="p-2 font-semibold bg-gray-50 border-r border-gray-300">종 목</div>
              <div className="p-2">모자 및 패션잡화</div>
            </div>
          </div>

          {/* 공급받는자 (Receiver) */}
          <div>
            <div className="bg-gray-100 font-bold py-1.5 text-center border-b border-gray-800">
              공 급 받 는 자
            </div>
            <div className="grid grid-cols-4 divide-y divide-gray-300">
              <div className="p-2 font-semibold bg-gray-50 border-r border-gray-300">등록번호</div>
              <div className="col-span-3 p-2 font-mono">{invoiceData.invoiceNumber.slice(0, 14)}</div>

              <div className="p-2 font-semibold bg-gray-50 border-r border-gray-300">상 호</div>
              <div className="p-2 border-r border-gray-300 font-bold">{invoiceData.buyerName}</div>
              <div className="p-2 font-semibold bg-gray-50 border-r border-gray-300">성 명</div>
              <div className="p-2">{invoiceData.buyerName.split(' ')[0]}</div>

              <div className="p-2 font-semibold bg-gray-50 border-r border-gray-300">사업장주소</div>
              <div className="col-span-3 p-2 truncate" title={invoiceData.buyerAddress}>
                {invoiceData.buyerAddress}
              </div>

              <div className="p-2 font-semibold bg-gray-50 border-r border-gray-300">연락처</div>
              <div className="col-span-3 p-2">{invoiceData.buyerPhone || '고객 정보 등록'}</div>
            </div>
          </div>
        </div>

        {/* Amounts Summary Box */}
        <div className="mt-4 border-2 border-gray-800 grid grid-cols-3 divide-x divide-gray-800 text-center text-xs">
          <div className="p-2">
            <span className="block text-gray-500 mb-1">공급가액 (Supply Price)</span>
            <span className="text-base font-extrabold text-gray-900">
              ₩{invoiceData.totalSupply.toLocaleString()}
            </span>
          </div>
          <div className="p-2">
            <span className="block text-gray-500 mb-1">세 액 (VAT 10%)</span>
            <span className="text-base font-extrabold text-gray-900">
              ₩{invoiceData.totalVat.toLocaleString()}
            </span>
          </div>
          <div className="p-2 bg-gray-50">
            <span className="block text-gray-500 mb-1">합 계 금 액 (Total Amount)</span>
            <span className={`text-base font-extrabold ${invoiceData.isSales ? 'text-red-600' : 'text-blue-600'}`}>
              ₩{invoiceData.grandTotal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Detailed Items Table */}
        <div className="mt-4 border-2 border-gray-800 overflow-hidden text-xs">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-100 font-bold text-center">
              <tr>
                <th className="py-2 px-2 border-r border-gray-800 w-12">월</th>
                <th className="py-2 px-2 border-r border-gray-800 w-12">일</th>
                <th className="py-2 px-4 border-r border-gray-800 text-left">품 목 (Item)</th>
                <th className="py-2 px-2 border-r border-gray-800 w-16">규 격</th>
                <th className="py-2 px-2 border-r border-gray-800 w-14">수 량</th>
                <th className="py-2 px-3 border-r border-gray-800 text-right">단 가</th>
                <th className="py-2 px-3 border-r border-gray-800 text-right">공급가액</th>
                <th className="py-2 px-3 border-r border-gray-800 text-right">세 액</th>
                <th className="py-2 px-3 text-center w-20">비 고</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300 text-center">
              {invoiceData.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="py-2 px-1 border-r border-gray-800">{item.month}</td>
                  <td className="py-2 px-1 border-r border-gray-800">{item.day}</td>
                  <td className="py-2 px-4 border-r border-gray-800 text-left font-medium">{item.name}</td>
                  <td className="py-2 px-2 border-r border-gray-800">{item.spec}</td>
                  <td className="py-2 px-2 border-r border-gray-800 font-bold">{item.qty}</td>
                  <td className="py-2 px-3 border-r border-gray-800 text-right">{item.unitPrice.toLocaleString()}</td>
                  <td className="py-2 px-3 border-r border-gray-800 text-right font-medium">{item.supplyAmt.toLocaleString()}</td>
                  <td className="py-2 px-3 border-r border-gray-800 text-right">{item.vatAmt.toLocaleString()}</td>
                  <td className="py-2 px-3 text-xs text-gray-500">{item.note}</td>
                </tr>
              ))}
              {/* Blank Filler Rows for official layout */}
              {Array.from({ length: Math.max(0, 4 - invoiceData.items.length) }).map((_, idx) => (
                <tr key={`blank-${idx}`}>
                  <td className="py-2 border-r border-gray-800">&nbsp;</td>
                  <td className="py-2 border-r border-gray-800">&nbsp;</td>
                  <td className="py-2 border-r border-gray-800">&nbsp;</td>
                  <td className="py-2 border-r border-gray-800">&nbsp;</td>
                  <td className="py-2 border-r border-gray-800">&nbsp;</td>
                  <td className="py-2 border-r border-gray-800">&nbsp;</td>
                  <td className="py-2 border-r border-gray-800">&nbsp;</td>
                  <td className="py-2 border-r border-gray-800">&nbsp;</td>
                  <td className="py-2">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Payment Terms */}
        <div className="mt-4 border-2 border-gray-800 grid grid-cols-5 divide-x divide-gray-800 text-center text-xs">
          <div className="p-2 bg-gray-50 font-bold">합계금액</div>
          <div className="p-2 bg-gray-50">현 금</div>
          <div className="p-2 bg-gray-50">수 표</div>
          <div className="p-2 bg-gray-50">외상미수금</div>
          <div className="p-2 bg-gray-100 font-bold">영수 / 청구</div>

          <div className="p-2 font-bold font-mono">₩{invoiceData.grandTotal.toLocaleString()}</div>
          <div className="p-2 font-mono">₩{invoiceData.grandTotal.toLocaleString()}</div>
          <div className="p-2 font-mono">0</div>
          <div className="p-2 font-mono">0</div>
          <div className="p-2 font-bold text-red-600">이 금액을 영수함</div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-400">
          본 명세서는 부가가치세법 제32조에 따라 정당하게 발급된 전자세금명세서입니다.
        </div>
      </div>
    </div>
  );
}

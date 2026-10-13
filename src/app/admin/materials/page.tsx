import { createClient } from '@/lib/supabase/server';
import { createMaterial, updateMaterialStock, deleteMaterial } from '@/app/admin/actions';
import { AlertTriangle, Plus, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

export default async function AdminMaterialsPage() {
  const supabase = await createClient();

  const { data: materials, error } = await supabase
    .from('materials')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🧵 원부자재 재고 관리</h1>
          <p className="text-sm text-gray-500 mt-1">
            모자 제작용 원단, 스냅, 땀받이, 자수사 등 원부자재 재고 추적 및 안전재고 알림 시스템입니다.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
          Supabase `materials` 테이블 조회 중 오류: {error.message}
        </div>
      )}

      {/* Grid: Form & List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Form: Add New Material */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-600" /> 신규 원부자재 등록
          </h2>

          <form action={createMaterial} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">자재명</label>
              <input 
                type="text" 
                name="name" 
                required 
                placeholder="예: 14수 워싱 코튼 트윌 원단 (Black)" 
                className="w-full border rounded-lg px-3 py-2 text-sm text-black" 
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">자재 코드</label>
                <input 
                  type="text" 
                  name="code" 
                  required 
                  placeholder="MAT-COT-01" 
                  className="w-full border rounded-lg px-3 py-2 text-sm text-black uppercase" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">관리 단위</label>
                <input 
                  type="text" 
                  name="unit" 
                  required 
                  placeholder="YD(야드), EA(개), ROLL" 
                  className="w-full border rounded-lg px-3 py-2 text-sm text-black" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">구매 단가 (원)</label>
              <input 
                type="number" 
                name="unit_price" 
                defaultValue={4500} 
                min={0} 
                required 
                className="w-full border rounded-lg px-3 py-2 text-sm text-black" 
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">초기 재고량</label>
                <input 
                  type="number" 
                  name="current_stock" 
                  defaultValue={100} 
                  min={0} 
                  required 
                  className="w-full border rounded-lg px-3 py-2 text-sm text-black" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">안전 재고 기준</label>
                <input 
                  type="number" 
                  name="safety_stock" 
                  defaultValue={30} 
                  min={0} 
                  required 
                  className="w-full border rounded-lg px-3 py-2 text-sm text-black" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors mt-2"
            >
              원부자재 등록하기
            </button>
          </form>
        </div>

        {/* Table: Materials List */}
        <div className="lg:col-span-2 bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
          <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
            <h2 className="text-base font-bold text-gray-900">원부자재 보유 현황 목록</h2>
            <span className="text-xs text-gray-500">총 {materials?.length || 0}건</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50/50 text-gray-600 font-semibold text-xs">
                <tr>
                  <th className="px-5 py-3 text-left">코드 / 자재명</th>
                  <th className="px-4 py-3 text-right">단가</th>
                  <th className="px-4 py-3 text-center">현재고 / 안전재고</th>
                  <th className="px-4 py-3 text-center">재고 조정 (입출고)</th>
                  <th className="px-4 py-3 text-center">상태</th>
                  <th className="px-4 py-3 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {materials && materials.length > 0 ? (
                  materials.map((m) => {
                    const isLowStock = m.current_stock <= m.safety_stock;

                    return (
                      <tr key={m.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="text-xs font-mono text-gray-400 block">{m.code}</span>
                          <span className="font-semibold text-gray-900">{m.name}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-medium text-gray-700 whitespace-nowrap">
                          {m.unit_price ? `${m.unit_price.toLocaleString()}원` : '-'}
                          <span className="text-xs text-gray-400 block">/ {m.unit}</span>
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <span className={`text-base font-bold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                            {m.current_stock}
                          </span>
                          <span className="text-xs text-gray-400 block">
                            (기준: {m.safety_stock} {m.unit})
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-center">
                          <div className="inline-flex items-center gap-1">
                            {/* 입고 +10 */}
                            <form action={async () => {
                              'use server';
                              await updateMaterialStock(m.id, 10);
                            }}>
                              <button 
                                type="submit" 
                                className="inline-flex items-center gap-0.5 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded font-medium"
                                title="+10 입고"
                              >
                                <ArrowUpCircle className="w-3.5 h-3.5" /> +10
                              </button>
                            </form>
                            {/* 차감 -10 */}
                            <form action={async () => {
                              'use server';
                              await updateMaterialStock(m.id, -10);
                            }}>
                              <button 
                                type="submit" 
                                className="inline-flex items-center gap-0.5 text-xs bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 px-2 py-1 rounded font-medium"
                                title="-10 사용 차감"
                              >
                                <ArrowDownCircle className="w-3.5 h-3.5" /> -10
                              </button>
                            </form>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          {isLowStock ? (
                            <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-800 px-2.5 py-1 rounded-full font-bold">
                              <AlertTriangle className="w-3 h-3" /> 재고부족
                            </span>
                          ) : (
                            <span className="inline-block text-xs bg-green-100 text-green-800 px-2.5 py-1 rounded-full font-medium">
                              정상
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <form action={async () => {
                            'use server';
                            await deleteMaterial(m.id);
                          }}>
                            <button 
                              type="submit" 
                              className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                              title="삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </form>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      등록된 원부자재가 없습니다. 좌측 폼에서 첫 원부자재를 등록해 보세요.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

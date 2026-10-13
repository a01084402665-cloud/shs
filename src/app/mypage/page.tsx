import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { User, Package, Heart, ShoppingBag, ExternalLink, FileText, ArrowRight } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '결제대기', color: 'bg-gray-100 text-gray-700' },
  paid: { label: '결제완료', color: 'bg-blue-100 text-blue-800' },
  preparing: { label: '배송준비', color: 'bg-yellow-100 text-yellow-800' },
  shipped: { label: '배송중', color: 'bg-purple-100 text-purple-800' },
  delivered: { label: '배송완료', color: 'bg-green-100 text-green-800' },
  cancelled: { label: '주문취소', color: 'bg-red-100 text-red-800' },
  refunded: { label: '환불완료', color: 'bg-pink-100 text-pink-800' },
};

export default async function MyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?error=' + encodeURIComponent('마이페이지를 확인하시려면 먼저 로그인해 주세요.'));
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .maybeSingle();

  const displayName = profile?.name || user.user_metadata?.name || '고객';

  // 사용자의 주문 내역 조회 (order_items 포함)
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      {/* User Greeting & Stats Card */}
      <div className="bg-white border rounded-2xl p-6 sm:p-8 mb-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center font-bold text-xl">
            {displayName.slice(0, 1)}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {displayName}님 환영합니다!
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{user.email}</p>
          </div>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <Link
            href="/wishlist"
            className="flex-1 sm:flex-initial bg-gray-50 hover:bg-gray-100 border text-gray-700 text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <Heart className="w-4 h-4 text-red-500 fill-red-500" /> 찜한 상품
          </Link>
          <Link
            href="/cart"
            className="flex-1 sm:flex-initial bg-gray-50 hover:bg-gray-100 border text-gray-700 text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" /> 장바구니
          </Link>
        </div>
      </div>

      {/* Orders Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5" /> 나의 주문 / 배송 내역
          </h2>
          <span className="text-xs text-gray-500">
            총 <strong className="text-black">{orders?.length || 0}</strong>건
          </span>
        </div>

        {orders && orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusInfo = STATUS_MAP[order.status] || {
                label: order.status,
                color: 'bg-gray-100 text-gray-700',
              };

              return (
                <div
                  key={order.id}
                  className="bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow space-y-4"
                >
                  {/* Order Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-4">
                    <div>
                      <div className="text-xs text-gray-400">
                        주문일시:{' '}
                        {new Date(order.created_at).toLocaleString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div className="font-bold text-gray-900 text-sm mt-0.5">
                        주문번호: {order.order_number}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-2">
                    {order.order_items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center text-sm py-1">
                        <div>
                          <span className="font-medium text-gray-900">{item.product_title}</span>
                          <span className="text-xs text-gray-400 ml-2">수량 {item.quantity}개</span>
                        </div>
                        <span className="font-bold text-gray-900">
                          {(item.total_amount || 0).toLocaleString()}원
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Delivery & Tracking & Receipt */}
                  <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600 flex flex-wrap items-center justify-between gap-3 border border-gray-100">
                    <div>
                      <div>
                        배송지: <span className="font-medium text-gray-900">{order.address}</span>
                      </div>
                      {order.tracking_number && (
                        <div className="mt-1">
                          운송장 정보:{' '}
                          <span className="font-semibold text-black">
                            {order.carrier || 'CJ대한통운'} {order.tracking_number}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-base text-red-600">
                        {order.total_amount?.toLocaleString()}원
                      </span>

                      {order.receipt_url && (
                        <a
                          href={order.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-white hover:bg-gray-100 border text-gray-700 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" /> 영수증
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-semibold text-sm">주문 내역이 없습니다.</p>
            <p className="text-xs text-gray-400 mt-1 mb-6">
              원하시는 모자를 골라 결제해 보세요!
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 bg-black hover:bg-gray-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              쇼핑하러 가기 <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

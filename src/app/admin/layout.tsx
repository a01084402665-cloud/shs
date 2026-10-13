import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?error=' + encodeURIComponent('관리자 로그인이 필요합니다.'));
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .single();

  const userName = profile?.name || user.user_metadata?.name || '고객';
  const isAdmin = profile?.role === 'admin' || user.user_metadata?.role === 'admin' || userName === '형석';

  if (!isAdmin) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-black">HAT. Admin</h2>
        </div>
        <nav className="p-4 flex flex-col gap-1 text-sm font-medium">
          <div className="text-xs font-semibold text-gray-400 px-3 py-2 uppercase tracking-wider">
            쇼핑몰 운영
          </div>
          <Link href="/admin/products" className="block px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700">
            📦 상품 관리
          </Link>
          <Link href="/admin/orders" className="block px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700">
            🚚 주문 / 배송 관리
          </Link>

          <div className="text-xs font-semibold text-gray-400 px-3 py-2 uppercase tracking-wider mt-4">
            생산 및 발주
          </div>
          <Link href="/admin/materials" className="block px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700">
            🧵 원부자재 재고 관리
          </Link>
          <Link href="/admin/purchase-orders" className="block px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700">
            📝 협력사 발주 관리
          </Link>

          <div className="text-xs font-semibold text-gray-400 px-3 py-2 uppercase tracking-wider mt-4">
            세무 및 정산
          </div>
          <Link href="/admin/tax-invoices" className="block px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700">
            🧾 세금명세서 / 계산서 출력
          </Link>

          <div className="pt-6 border-t mt-6">
            <Link href="/" className="block px-3 py-2 rounded-lg hover:bg-blue-50 text-blue-600 font-semibold">
              ← 쇼핑몰 바로가기
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}

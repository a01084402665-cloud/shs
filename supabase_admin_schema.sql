-- ========================================================
-- [다써바 모자] 관리자 백오피스 통합 스키마 (자재/발주/주문/세무)
-- Supabase SQL Editor에 복사하여 Run(실행)해 주세요.
-- ========================================================

-- 1. 원부자재 테이블 (materials)
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  unit TEXT NOT NULL DEFAULT 'EA',
  unit_price INTEGER DEFAULT 0,
  current_stock INTEGER DEFAULT 0,
  safety_stock INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 기존 테이블 컬럼 누락 방지 (ALTER TABLE)
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS unit_price INTEGER DEFAULT 0;

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable ALL for everyone on materials" ON public.materials;
CREATE POLICY "Enable ALL for everyone on materials" ON public.materials FOR ALL USING (true) WITH CHECK (true);

-- 2. 협력사 발주 테이블 (purchase_orders)
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE,
  supplier_name TEXT NOT NULL,
  material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,
  material_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER DEFAULT 0,
  supply_amount INTEGER DEFAULT 0,
  vat_amount INTEGER DEFAULT 0,
  total_amount INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, ordered, completed, cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 기존 테이블 컬럼 누락 방지 (ALTER TABLE)
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS order_number TEXT;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS material_name TEXT;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS unit_price INTEGER DEFAULT 0;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS supply_amount INTEGER DEFAULT 0;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS vat_amount INTEGER DEFAULT 0;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS total_amount INTEGER DEFAULT 0;

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable ALL for everyone on purchase_orders" ON public.purchase_orders;
CREATE POLICY "Enable ALL for everyone on purchase_orders" ON public.purchase_orders FOR ALL USING (true) WITH CHECK (true);

-- 3. 주문 및 배송 관리 테이블 (orders)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_phone TEXT,
  address TEXT,
  carrier TEXT DEFAULT 'CJ대한통운',
  tracking_number TEXT,
  supply_amount INTEGER DEFAULT 0,
  vat_amount INTEGER DEFAULT 0,
  total_amount INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'paid', -- pending, paid, preparing, shipped, delivered, cancelled, refunded
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 기존 컬럼 누락 방지 (ALTER TABLE)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS carrier TEXT DEFAULT 'CJ대한통운';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS supply_amount INTEGER DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS vat_amount INTEGER DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_key TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS receipt_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zipcode TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_memo TEXT;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable ALL for everyone on orders" ON public.orders;
CREATE POLICY "Enable ALL for everyone on orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

-- 4. 주문 상세 품목 테이블 (order_items)
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_title TEXT NOT NULL,
  spec TEXT DEFAULT 'FREE',
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL DEFAULT 0,
  supply_amount INTEGER DEFAULT 0,
  vat_amount INTEGER DEFAULT 0,
  total_amount INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable ALL for everyone on order_items" ON public.order_items;
CREATE POLICY "Enable ALL for everyone on order_items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);

-- 5. 찜 (위시리스트) 테이블 (wishlists)
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable ALL for everyone on wishlists" ON public.wishlists;
CREATE POLICY "Enable ALL for everyone on wishlists" ON public.wishlists FOR ALL USING (true) WITH CHECK (true);

-- 6. 장바구니 테이블 (cart)
CREATE TABLE IF NOT EXISTS public.cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, product_id)
);

-- 기존 컬럼 누락 방지 (ALTER TABLE)
ALTER TABLE public.cart ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable ALL for everyone on cart" ON public.cart;
CREATE POLICY "Enable ALL for everyone on cart" ON public.cart FOR ALL USING (true) WITH CHECK (true);

-- ========================================================
-- 7. 테스트 및 시연용 기본 샘플 데이터 자동 생성
-- ========================================================

-- 원부자재 샘플 등록 (중복 방지)
INSERT INTO public.materials (name, code, unit, unit_price, current_stock, safety_stock)
SELECT '14수 워싱 코튼 트윌 원단 (Black)', 'MAT-COT-001', 'YD', 4500, 150, 40
WHERE NOT EXISTS (SELECT 1 FROM public.materials WHERE code = 'MAT-COT-001');

INSERT INTO public.materials (name, code, unit, unit_price, current_stock, safety_stock)
SELECT '빈티지 워싱 데님 원단 (Indigo Blue)', 'MAT-DNM-002', 'YD', 6800, 80, 30
WHERE NOT EXISTS (SELECT 1 FROM public.materials WHERE code = 'MAT-DNM-002');

INSERT INTO public.materials (name, code, unit, unit_price, current_stock, safety_stock)
SELECT '7단 조절 플라스틱 스냅백 버클 (Black)', 'MAT-SNP-003', 'EA', 350, 420, 100
WHERE NOT EXISTS (SELECT 1 FROM public.materials WHERE code = 'MAT-SNP-003');

INSERT INTO public.materials (name, code, unit, unit_price, current_stock, safety_stock)
SELECT '기능성 쿨에버 흡한속건 땀받이 밴드 (White)', 'MAT-SWT-004', 'YD', 1200, 200, 50
WHERE NOT EXISTS (SELECT 1 FROM public.materials WHERE code = 'MAT-SWT-004');

-- 협력사 발주 샘플 등록 (중복 방지)
INSERT INTO public.purchase_orders (order_number, supplier_name, material_name, quantity, unit_price, supply_amount, vat_amount, total_amount, status)
SELECT 'PO-20261012-001', '(주)동대문텍스타일', '14수 워싱 코튼 트윌 원단 (Black)', 200, 4500, 900000, 90000, 990000, 'completed'
WHERE NOT EXISTS (SELECT 1 FROM public.purchase_orders WHERE order_number = 'PO-20261012-001');

INSERT INTO public.purchase_orders (order_number, supplier_name, material_name, quantity, unit_price, supply_amount, vat_amount, total_amount, status)
SELECT 'PO-20261012-002', '신안부자재상사', '7단 조절 플라스틱 스냅백 버클 (Black)', 500, 350, 175000, 17500, 192500, 'ordered'
WHERE NOT EXISTS (SELECT 1 FROM public.purchase_orders WHERE order_number = 'PO-20261012-002');

-- 주문 1 등록
INSERT INTO public.orders (id, order_number, customer_name, customer_phone, address, carrier, tracking_number, supply_amount, vat_amount, total_amount, status)
SELECT 'a0000000-0000-0000-0000-000000000001'::uuid, 'ORD-20261012-01', '김철수 (한국모자클럽)', '010-9876-5432', '서울특별시 서초구 강남대로 456, 5층', 'CJ대한통운', '654321098765', 108909, 10891, 119800, 'shipped'
WHERE NOT EXISTS (SELECT 1 FROM public.orders WHERE order_number = 'ORD-20261012-01');

-- 주문 1 상세 품목 등록
INSERT INTO public.order_items (order_id, product_title, spec, quantity, unit_price, supply_amount, vat_amount, total_amount)
SELECT 'a0000000-0000-0000-0000-000000000001'::uuid, 'Superdry 빈티지 데님 볼캡', 'FREE / Black', 2, 39900, 72545, 7255, 79800
WHERE NOT EXISTS (SELECT 1 FROM public.order_items WHERE product_title = 'Superdry 빈티지 데님 볼캡');

INSERT INTO public.order_items (order_id, product_title, spec, quantity, unit_price, supply_amount, vat_amount, total_amount)
SELECT 'a0000000-0000-0000-0000-000000000001'::uuid, 'Kodak 블루 워싱 볼캡', 'FREE / Blue', 1, 35000, 31818, 3182, 35000
WHERE NOT EXISTS (SELECT 1 FROM public.order_items WHERE product_title = 'Kodak 블루 워싱 볼캡');

-- 주문 2 등록
INSERT INTO public.orders (id, order_number, customer_name, customer_phone, address, carrier, tracking_number, supply_amount, vat_amount, total_amount, status)
SELECT 'a0000000-0000-0000-0000-000000000002'::uuid, 'ORD-20261012-02', '이영희', '010-3322-1100', '경기도 성남시 분당구 판교역로 12', '한진택배', '112233445566', 38182, 3818, 42000, 'delivered'
WHERE NOT EXISTS (SELECT 1 FROM public.orders WHERE order_number = 'ORD-20261012-02');

-- 주문 2 상세 품목 등록
INSERT INTO public.order_items (order_id, product_title, spec, quantity, unit_price, supply_amount, vat_amount, total_amount)
SELECT 'a0000000-0000-0000-0000-000000000002'::uuid, 'Customellow 베이지 코튼 볼캡', 'FREE / Beige', 1, 42000, 38182, 3818, 42000
WHERE NOT EXISTS (SELECT 1 FROM public.order_items WHERE product_title = 'Customellow 베이지 코튼 볼캡');

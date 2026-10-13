import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HAT SHOP - 모자 전문 쇼핑몰",
  description: "다양한 모자를 만나보세요. 볼캡, 버킷햇, 비니 등",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isAdmin = false;
  let userName = '고객';

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, role')
      .eq('id', user.id)
      .single();

    userName = profile?.name || user.user_metadata?.name || '고객';
    isAdmin = profile?.role === 'admin' || user.user_metadata?.role === 'admin' || userName === '형석';

    // 현재 관리자 계정이 아직 admin 역할로 저장되어 있지 않다면 자동 반영
    if (userName === '형석' && profile?.role !== 'admin') {
      await supabase.from('profiles').update({ role: 'admin' }).eq('id', user.id);
      isAdmin = true;
    }
  }

  let cartCount = 0;
  if (user) {
    const { data: cartData } = await supabase
      .from('cart')
      .select('quantity')
      .eq('user_id', user.id);

    if (cartData) {
      cartCount = cartData.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
    }
  }

  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header user={user} isAdmin={isAdmin} userName={userName} cartCount={cartCount} />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

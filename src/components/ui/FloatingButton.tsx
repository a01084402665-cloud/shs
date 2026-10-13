import { MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function FloatingButton() {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {/* Scroll to Top or Other buttons could go here */}
      
      {/* Kakao Talk Button */}
      <Link
        href="https://pf.kakao.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FEE500] shadow-lg hover:scale-105 transition-transform"
        aria-label="카카오톡 상담하기"
      >
        <MessageCircle className="h-7 w-7 text-black" fill="black" />
      </Link>
    </div>
  );
}

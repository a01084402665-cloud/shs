import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t bg-gray-50 py-12 mt-10">
      <div className="container mx-auto px-4 text-sm text-gray-600">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold tracking-widest text-lg mb-4 text-black">HAT.</h3>
            <p>모자 전문 쇼핑몰</p>
            <p className="mt-2 text-xs">고객센터: 1588-0000</p>
            <p className="text-xs">운영시간: 평일 10:00 - 17:00</p>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-black">INFORMATION</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="hover:underline">회사소개</Link></li>
              <li><Link href="/terms" className="hover:underline">이용약관</Link></li>
              <li><Link href="/privacy" className="hover:underline font-bold text-black">개인정보처리방침</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-black">CUSTOMER</h4>
            <ul className="space-y-2">
              <li><Link href="/notice" className="hover:underline">공지사항</Link></li>
              <li><Link href="/faq" className="hover:underline">자주묻는질문</Link></li>
              <li><Link href="/qna" className="hover:underline">상품문의</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-black">BANK INFO</h4>
            <p className="text-xs">국민 123-456-789012</p>
            <p className="text-xs">예금주: 햇샵(주)</p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-xs text-center md:text-left text-gray-500">
          © {new Date().getFullYear()} HAT. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

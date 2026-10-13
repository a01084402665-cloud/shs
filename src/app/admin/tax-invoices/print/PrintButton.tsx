'use client';

import { Printer } from 'lucide-react';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow transition-all cursor-pointer"
    >
      <Printer className="w-4 h-4" /> 세금명세서 인쇄 / PDF 저장
    </button>
  );
}

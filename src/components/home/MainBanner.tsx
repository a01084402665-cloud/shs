'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

const SLIDES = [
  { text: "0000000", image: "/superdry-banner.jpg" },
  { text: "XXXX", image: "/kodak-banner.jpg" },
  { text: "ZZZZ", image: "/customellow-banner.jpg" },
];

export default function MainBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 4000); // 4초마다 슬라이드 변경
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative w-full h-[400px] md:h-[600px] bg-black overflow-hidden">
      {/* Slides Container */}
      <div 
        className="flex w-full h-full transition-transform duration-1000 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {SLIDES.map((slide, index) => (
          <div key={index} className="w-full h-full flex-shrink-0 relative flex items-center justify-center">
            {/* Background image */}
            <div className="absolute inset-0 z-0">
              <Image
                src={slide.image}
                alt={`Banner ${index + 1}`}
                fill
                className="object-cover opacity-80"
                priority={index === 0}
              />
            </div>
            
            <div className="relative z-10 text-center px-4">
              <h2 className="text-5xl md:text-7xl font-black text-white tracking-widest drop-shadow-2xl">
                {slide.text}
              </h2>
            </div>
          </div>
        ))}
      </div>

      {/* Carousel Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {SLIDES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              currentSlide === index ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

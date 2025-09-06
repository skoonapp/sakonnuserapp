import React, { useState, useEffect, useRef } from 'react';
import { TESTIMONIALS_DATA } from '../constants';

const Testimonials: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timeoutRef = useRef<number | null>(null);

  const resetTimeout = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    resetTimeout();
    timeoutRef.current = window.setTimeout(
      () =>
        setCurrentIndex((prevIndex) =>
          (prevIndex + 1) % TESTIMONIALS_DATA.length
        ),
      5000 // 5 seconds
    );

    return () => {
      resetTimeout();
    };
  }, [currentIndex]);

  return (
    <div className="mt-8 md:mt-12 text-center">
      <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">यूज़र्स क्या कहते हैं</h3>
      <p className="text-base text-slate-600 dark:text-slate-400 mb-8 px-4">हमारे खुश यूज़र्स के कुछ अनुभव।</p>
      
      <div className="relative max-w-2xl mx-auto">
        <div className="overflow-hidden">
          <div
            className="flex transition-transform ease-in-out duration-500"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {TESTIMONIALS_DATA.map((testimonial, index) => (
              <div key={index} className="w-full flex-shrink-0 px-4">
                <div className="flex flex-col items-center min-h-[200px] justify-center">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name} 
                    className="w-20 h-20 rounded-full object-cover mb-4 shadow-md border-4 border-white dark:border-slate-700"
                    loading="lazy" decoding="async"
                  />
                  <blockquote className="text-base text-slate-600 dark:text-slate-400 italic leading-relaxed mb-4 max-w-lg">
                    "{testimonial.quote}"
                  </blockquote>
                  <cite className="font-semibold text-slate-800 dark:text-slate-100 not-italic">- {testimonial.name}</cite>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center mt-6 space-x-2">
          {TESTIMONIALS_DATA.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-colors ${currentIndex === index ? 'bg-cyan-600' : 'bg-slate-300 dark:bg-slate-700'}`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(Testimonials);
import React, { useState } from 'react';
import { FAQ_DATA } from '../constants';
import FAQItem from './FAQItem';

const FAQ: React.FC = () => {
  // State for individual accordion items
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  // State for the main dropdown visibility
  const [isSectionOpen, setIsSectionOpen] = useState(false);

  const handleItemToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const toggleSection = () => {
    setIsSectionOpen(prev => !prev);
  };

  return (
    <div id="faq">
      <div className="container mx-auto">
        <div className="max-w-2xl mx-auto bg-slate-50 dark:bg-slate-900/50 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden">
          <button
            onClick={toggleSection}
            className="w-full flex justify-between items-center text-left p-6"
            aria-expanded={isSectionOpen}
            aria-controls="faq-list"
          >
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">आपके सवालों के जवाब</h2>
            <span className={`transform transition-transform duration-300 ${isSectionOpen ? 'rotate-180' : 'rotate-0'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>
          
          <div
            id="faq-list"
            className={`transition-all duration-500 ease-in-out ${isSectionOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}
          >
            <div className="px-6 pb-6 pt-0 space-y-2">
              {FAQ_DATA.map((item, index) => (
                <FAQItem
                  key={index}
                  {...item}
                  isOpen={openIndex === index}
                  onToggle={() => handleItemToggle(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(FAQ);
import React, { useState } from 'react';
import { FAQ_DATA } from '../constants';
import FAQItem from './FAQItem';

interface FAQProps {
  isOpen: boolean;
  onToggle: () => void;
}

const FAQ: React.FC<FAQProps> = ({ isOpen, onToggle }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleItemToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center text-left p-6"
        aria-expanded={isOpen}
        aria-controls="faq-list"
      >
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">आपके सवालों के जवाब</h2>
        <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      
      <div
        id="faq-list"
        className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0'} overflow-hidden`}
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
    </>
  );
};

export default React.memo(FAQ);
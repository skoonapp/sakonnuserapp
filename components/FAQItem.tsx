
import React, { useState } from 'react';
import type { FaqItem } from '../types';

// New Answer Renderer component to handle numbered lists and bold text
const AnswerRenderer: React.FC<{ text: string }> = ({ text }) => {
    // Using a regex to check for the list pattern to be more robust
    if (!/\n\s*1\./.test(text)) {
        return <p>{text}</p>;
    }

    const parts = text.split('\n');
    const introduction = parts[0];
    const listItems = parts.slice(1).filter(item => item.trim() !== '');

    return (
        <div>
            <p className="mb-3">{introduction}</p>
            <ol className="list-decimal list-inside space-y-2">
                {listItems.map((item, index) => {
                    const cleanItem = item.replace(/^\d+\.\s*/, '');
                    // Simple markdown-like parser for bold text (**text**)
                    const itemParts = cleanItem.split(/(\*\*.*?\*\*)/g).filter(Boolean);
                    
                    return (
                        <li key={index}>
                            {itemParts.map((part, partIndex) => {
                                if (part.startsWith('**') && part.endsWith('**')) {
                                    return <strong key={partIndex} className="font-semibold text-slate-700 dark:text-slate-300">{part.slice(2, -2)}</strong>;
                                }
                                return part;
                            })}
                        </li>
                    );
                })}
            </ol>
        </div>
    );
};


const FAQItem: React.FC<FaqItem> = ({ question, answer, isPositive }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Icons are smaller now and use flex-shrink-0 to prevent resizing
  const CheckIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
     </svg>
  );

  const CrossIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
     </svg>
  );


  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left p-5 focus:outline-none"
      >
        <span className="text-lg font-medium text-slate-800 dark:text-slate-200">{question}</span>
        <span className="text-cyan-600 dark:text-cyan-400 transform transition-transform duration-300" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-96' : 'max-h-0'}`}
      >
        <div className="p-5 pt-0 text-slate-600 dark:text-slate-400 flex items-start gap-3">
          {isPositive ? <CheckIcon /> : <CrossIcon />}
          <div className="flex-1">
             <AnswerRenderer text={answer} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(FAQItem);

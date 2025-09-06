

import React from 'react';
import type { FaqItem } from '../types';

// New Answer Renderer component to handle numbered lists and bold text
const AnswerRenderer: React.FC<{ text: string }> = ({ text }) => {
    // Generic markdown parser for bold text (**text**)
    const parseMarkdown = (line: string) => {
        // Split by the markdown delimiter, but keep the delimiter itself in the array for processing
        const parts = line.split(/(\*\*.*?\*\*)/g).filter(Boolean);
        
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                // If it's a bold part, render a <strong> tag
                return <strong key={index} className="font-semibold text-slate-700 dark:text-slate-200">{part.slice(2, -2)}</strong>;
            }
            // Otherwise, return the plain text part
            return part;
        });
    };

    // Check for a numbered list pattern in the answer text
    if (/\n\s*1\./.test(text)) {
        const parts = text.split('\n');
        const introduction = parts[0];
        const listItems = parts.slice(1).filter(item => item.trim() !== '');

        return (
            // Use a div that supports word breaking to prevent overflow
            <div className="break-words">
                <p className="mb-3">{parseMarkdown(introduction)}</p>
                <ol className="list-decimal list-inside space-y-2">
                    {listItems.map((item, index) => (
                        <li key={index}>
                            {parseMarkdown(item.replace(/^\d+\.\s*/, ''))}
                        </li>
                    ))}
                </ol>
            </div>
        );
    }

    // Handle simple paragraphs with potential markdown and ensure word breaking
    return (
        <p className="break-words">
            {parseMarkdown(text)}
        </p>
    );
};


interface FAQItemProps extends FaqItem {
  isOpen: boolean;
  onToggle: () => void;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, isPositive, isOpen, onToggle }) => {
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
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center text-left p-5 focus:outline-none"
      >
        <span className="text-lg font-medium text-slate-800 dark:text-slate-100">{question}</span>
        <span className="text-cyan-600 dark:text-cyan-400 transform transition-transform duration-300" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[1000px]' : 'max-h-0'}`}
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
import React from 'react';
import { FAQ_DATA } from '../constants';
import FAQItem from './FAQItem';

const FAQ: React.FC = () => {
  return (
    <section id="faq" className="py-6 bg-slate-50 dark:bg-slate-950/50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100">आपके सवालों के जवाब</h2>
        </div>
        <div className="max-w-2xl mx-auto space-y-2">
          {FAQ_DATA.map((item, index) => (
            <FAQItem key={index} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default React.memo(FAQ);
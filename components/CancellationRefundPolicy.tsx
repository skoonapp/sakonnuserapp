

import React from 'react';

interface CancellationRefundPolicyProps {
  onClose: () => void;
}

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const CancellationRefundPolicy: React.FC<CancellationRefundPolicyProps> = ({ onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
            🔄 Cancellation/Refund Policy
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
            aria-label="Close"
          >
            <CloseIcon className="w-8 h-8" />
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-4 text-slate-700 dark:text-slate-200 leading-relaxed">
            <p className="font-semibold">प्रभावी तिथि: 1 अगस्त 2025</p>

            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">1. सामान्य नीति</h3>
              <p>SakoonApp पर खरीदे गए सभी प्लान (कॉलिंग/चैट मिनट) और टोकन पैक अंतिम बिक्री हैं और आम तौर पर गैर-वापसी योग्य (non-refundable) होते हैं। एक बार सेवा खरीद लेने के बाद, इसे रद्द नहीं किया जा सकता है।</p>
            </div>

            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">2. अप्रयुक्त (Unused) समय या टोकन</h3>
              <p>आपके प्लान में बचा हुआ कोई भी समय या आपके वॉलेट में अप्रयुक्त टोकन के लिए कोई धनवापसी नहीं की जाएगी। खरीदे गए प्लान की वैधता खरीदने की तारीख से 30 दिनों तक होती है, जिसके बाद अप्रयुक्त समय समाप्त हो जाएगा।</p>
            </div>
            
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">3. अपवाद (Exceptions)</h3>
              <ul className="list-disc list-inside space-y-1 pl-2">
                  <li><strong>भुगतान विफलता (Payment Failure):</strong> यदि आपके बैंक खाते से पैसे कट जाते हैं, लेकिन प्लान या टोकन आपके SakoonApp वॉलेट में नहीं जुड़ते हैं, तो हमारा पेमेंट गेटवे आमतौर पर 5-7 व्यावसायिक दिनों के भीतर आपके खाते में पैसे वापस कर देता है। यदि आपको इस अवधि में धनवापसी नहीं मिलती है, तो कृपया अपने भुगतान विवरण के साथ हमसे संपर्क करें।</li>
                  <li><strong>तकनीकी खराबी:</strong> यदि SakoonApp की ओर से किसी बड़ी तकनीकी खराबी के कारण आप खरीदे गए प्लान का उपयोग नहीं कर पा रहे हैं, तो कृपया हमारी सहायता टीम से संपर्क करें। हम मामले की जांच करेंगे और उचित समाधान (जैसे क्रेडिट या, दुर्लभ मामलों में, धनवापसी) प्रदान कर सकते हैं।</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">4. संपर्क कैसे करें</h3>
              <p>किसी भी भुगतान-संबंधी समस्या के लिए, कृपया हमें अपनी लेनदेन आईडी और समस्या के विवरण के साथ <a href="mailto:appsakoon@gmail.com" className="text-cyan-600 dark:text-cyan-300 hover:underline">appsakoon@gmail.com</a> पर ईमेल करें।</p>
            </div>
            
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">5. नीति में परिवर्तन</h3>
              <p>SakoonApp किसी भी समय इस नीति को बदलने का अधिकार सुरक्षित रखता है। कोई भी बदलाव ऐप पर पोस्ट किया जाएगा।</p>
            </div>
        </div>
        
        <div className="sticky bottom-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-4 text-right border-t border-slate-200 dark:border-slate-800">
             <button
                onClick={onClose}
                className="bg-cyan-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-cyan-700 transition-colors"
             >
                बंद करें
             </button>
        </div>
      </div>
    </div>
  );
};

export default CancellationRefundPolicy;
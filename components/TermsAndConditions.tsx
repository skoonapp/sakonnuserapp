
import React from 'react';

interface TermsAndConditionsProps {
  onClose: () => void;
}

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({ onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-200">
            📘 Terms & Conditions
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
            aria-label="Close"
          >
            <CloseIcon className="w-8 h-8" />
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed">
            <p className="font-semibold">प्रभावी तिथि: 1 अगस्त 2025</p>

            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">1. प्लेटफ़ॉर्म का उद्देश्य और होस्ट की भूमिका</h3>
              <p>SakoonApp उपयोगकर्ताओं और होस्ट्स के बीच सुरक्षित व सकारात्मक संवाद का माध्यम है। होस्ट्स को उपयोगकर्ताओं से सम्मानपूर्वक, संवेदनशीलता के साथ व्यवहार करना होगा।</p>
            </div>

            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">2. होस्ट के लिए आचरण की शर्तें:</h3>
              <ul className="list-disc list-inside space-y-1 pl-2">
                  <li><strong>पेशेवरता बनाए रखें:</strong> उचित भाषा और शिष्ट व्यवहार आवश्यक है।</li>
                  <li><strong>सकारात्मक व प्रासंगिक सामग्री:</strong> समुदाय के मानदंडों के अनुसार सामग्री साझा करें।</li>
                  <li><strong>प्राइवेसी का सम्मान करें:</strong> व्यक्तिगत जानकारी साझा न करें या पूछें।</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">3. निषिद्ध गतिविधियाँ:</h3>
              <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>धमकी, गाली-गलौज, अश्लीलता या किसी प्रकार का उत्पीड़न</li>
                  <li>जाति, धर्म, लिंग, भाषा आदि के आधार पर भेदभाव</li>
                  <li>ऑफ-प्लेटफ़ॉर्म संपर्क को बढ़ावा देना</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">4. रिपोर्टिंग और सुरक्षा:</h3>
              <p>ऐप में रिपोर्ट फीचर के माध्यम से अनुचित व्यवहार की रिपोर्ट करें। बाल सुरक्षा के लिए हम CSAM (बाल यौन शोषण सामग्री) के विरुद्ध सख्त कदम उठाते हैं।</p>
            </div>

            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">5. डेटा सुरक्षा:</h3>
              <p>किसी भी यूज़र की व्यक्तिगत जानकारी रिकॉर्ड या साझा करना प्रतिबंधित है।</p>
            </div>
            
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">6. भुगतान और उपहार:</h3>
              <p>यूज़र द्वारा भेजे गए वर्चुअल गिफ्ट सिर्फ आभार के प्रतीक हैं, पैसे की अपेक्षा नहीं की जा सकती।</p>
            </div>

            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">7. दायित्व की सीमा:</h3>
              <p>कंपनी सिर्फ एक मंच प्रदान करती है; होस्ट और यूज़र के बीच की बातचीत पर जिम्मेदारी नहीं लेती।</p>
            </div>

            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">8. खाता निलंबन/समाप्ति:</h3>
              <p>नियमों का उल्लंघन करने पर खाता अस्थायी या स्थायी रूप से निलंबित किया जा सकता है।</p>
            </div>

            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">9. नियमों में परिवर्तन:</h3>
              <p>समय-समय पर अपडेट किए जा सकते हैं। जारी उपयोग का अर्थ होगा सहमति।</p>
            </div>
            
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">10. सहमति की पुष्टि:</h3>
              <p>"मैं सहमत हूँ" बटन पर क्लिक करके आप इन शर्तों को स्वीकार करते हैं और मानते हैं कि आपने इन्हें पढ़ा और समझा है।</p>
            </div>
        </div>
        
        <div className="sticky bottom-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-4 text-right border-t border-slate-200 dark:border-slate-700">
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

export default TermsAndConditions;
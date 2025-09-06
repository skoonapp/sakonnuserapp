import React, { useState, useEffect, useRef } from 'react';
import { db, auth, serverTimestamp } from '../utils/firebase';

// Icon for privacy note
const LockIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
    </svg>
);

const WarningIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
);

const LANGUAGES = [
  { value: 'hindi', label: 'हिंदी (Hindi)' },
  { value: 'urdu', label: 'उर्दू (Urdu)' },
  { value: 'awadhi', label: 'अवधी (Awadhi)' },
  { value: 'bhojpuri', label: 'भोजपुरी (Bhojpuri)' },
  { value: 'maithili', label: 'मैथिली (Maithili)' },
  { value: 'punjabi', label: 'पंजाबी (Punjabi)' },
  { value: 'bangla', label: 'बंगाली (Bangla)' },
  { value: 'gujarati', label: 'गुजराती (Gujarati)' },
  { value: 'marathi', label: 'मराठी (Marathi)' },
  { value: 'english', label: 'अंग्रेज़ी (English)' },
  { value: 'tamil', label: 'तमिल (Tamil)' },
  { value: 'telugu', label: 'तेलुगु (Telugu)' },
  { value: 'kannada', label: 'कन्नड़ (Kannada)' },
  { value: 'malayalam', label: 'मलयालम (Malayalam)' },
  { value: 'odia', label: 'ओड़िया (Odia)' },
  { value: 'assamese', label: 'असमिया (Assamese)' },
];


const ApplyAsListener: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    displayName: '',
    phone: '',
    bankAccount: '',
    ifsc: '',
    bankName: '',
    upiId: '',
    profession: '',
    languages: [] as string[],
  });
  const [email, setEmail] = useState('');
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const languageDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
        setFormData(prev => ({ ...prev, phone: user.phoneNumber?.replace('+91', '') || '' }));
        setEmail(user.email || '');
    }
  }, []);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
            setLanguageDropdownOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleLanguageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setFormData(prev => {
        const currentLanguages = prev.languages;
        if (checked) {
            return { ...prev, languages: [...currentLanguages, value] };
        } else {
            return { ...prev, languages: currentLanguages.filter(lang => lang !== value) };
        }
    });
  };
  
  const handleNext = () => {
    // Step 1 Validation
    if (!formData.fullName.trim()) {
        setError("कृपया अपना पूरा नाम दर्ज करें।");
        return;
    }
    if (!formData.displayName.trim()) {
        setError("कृपया प्रदर्शित नाम दर्ज करें।");
        return;
    }
    if (!/^\d{10}$/.test(formData.phone.trim())) {
        setError("कृपया एक मान्य 10-अंकीय मोबाइल नंबर दर्ज करें।");
        return;
    }
     if (!formData.profession) {
        setError("कृपया अपना पेशा चुनें।");
        return;
    }
    setError('');
    setStep(2);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      setError("आपको पहले लॉग इन करना होगा।");
      return;
    }
    
    // Step 2 Validation
    if (formData.languages.length === 0) {
        setError("कृपया कम से कम एक भाषा चुनें।");
        return;
    }
    const hasBankDetails = formData.bankAccount.trim() && formData.ifsc.trim() && formData.bankName.trim();
    const hasUpi = formData.upiId.trim();
    if (!hasBankDetails && !hasUpi) {
        setError("कृपया भुगतान के लिए बैंक विवरण या UPI ID प्रदान करें।");
        return;
    }

    setLoading(true);
    setError('');

    try {
      await db.collection('applications').add({
        uid: user.uid,
        email: email,
        ...formData,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setApplied(true);
    } catch (err) {
      console.error("Application submission error:", err);
      setError("आवेदन जमा करने में विफल। कृपया पुन: प्रयास करें।");
    } finally {
      setLoading(false);
    }
  };

  if (applied) {
    return (
      <div className="text-center p-8 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-lg">
        <h3 className="text-2xl font-bold text-green-700 dark:text-green-300">✅ धन्यवाद! आपका आवेदन जमा हो गया है।</h3>
        <p className="text-lg text-green-600 dark:text-green-400 mt-2">
          आपके फॉर्म का स्टेटस अगले 24 घंटों के भीतर आपके मोबाइल नंबर या WhatsApp पर सूचित कर दिया जाएगा।
        </p>
      </div>
    );
  }

  if (!showForm) {
    return (
        <div className="text-center">
            <button 
                onClick={() => setShowForm(true)}
                className="bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-cyan-700 transition-colors shadow-lg transform hover:scale-105"
            >
                Apply Now
            </button>
        </div>
    );
  }


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
          <p className="font-bold text-lg text-slate-700 dark:text-slate-300">Step {step} of 2</p>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mt-1">
              <div className="bg-cyan-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${step === 1 ? '50%' : '100%'}` }}></div>
          </div>
      </div>

      {/* Warning Note */}
      <div className="bg-yellow-50 dark:bg-amber-500/10 border-l-4 border-yellow-400 dark:border-amber-500/30 text-yellow-800 dark:text-amber-300 p-4 rounded-r-lg" role="alert">
        <div className="flex items-center">
            <WarningIcon className="w-6 h-6 mr-3"/>
            <h4 className="font-bold">महत्वपूर्ण सूचना</h4>
        </div>
        <ul className="list-disc list-inside mt-2 text-sm space-y-1">
            <li>वही फॉर्म अप्लाई करे जिसकी उम्र 18-40 तक हो।</li>
            <li>गलत जानकारी देने पर आपका Payout Hold हो जायेगा।</li>
        </ul>
      </div>
      
      {step === 1 && (
        <>
            {/* Name Fields */}
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="fullName" className="block text-md font-medium text-slate-700 dark:text-slate-300 mb-2">
                    पूरा नाम <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="बैंक में जो नाम है वही डालें"
                    className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 transition"
                    required
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">आपका असली नाम लोगों को नहीं दिखाया जाएगा।</p>
                </div>
                <div>
                  <label htmlFor="displayName" className="block text-md font-medium text-slate-700 dark:text-slate-300 mb-2">
                    लोगो को क्या नाम दिखे आप का <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleChange}
                    placeholder="लोगो को यही नाम दिखेगा"
                    className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 transition"
                    required
                  />
                </div>
            </div>
            
            {/* Contact & Profession */}
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone" className="block text-md font-medium text-slate-700 dark:text-slate-300 mb-2">
                    मोबाइल नंबर <span className="text-red-500">*</span>
                  </label>
                  <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      maxLength={10}
                      placeholder="10-अंकीय मोबाइल नंबर"
                      className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 transition"
                      required
                  />
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <LockIcon className="w-3 h-3"/>
                      <span>आपका फ़ोन और ईमेल किसी के साथ साझा नहीं किया जाएगा।</span>
                  </div>
                </div>
                <div>
                  <label htmlFor="profession" className="block text-md font-medium text-slate-700 dark:text-slate-300 mb-2">
                      पेशा (Profession) <span className="text-red-500">*</span>
                  </label>
                  <select
                      id="profession"
                      name="profession"
                      value={formData.profession}
                      onChange={handleChange}
                      className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 transition"
                      required
                  >
                      <option value="">-- चुनें --</option>
                      <option value="student">Student</option>
                      <option value="widow">विधवा</option>
                      <option value="married">शादीशुदा</option>
                      <option value="homemaker">घरेलू महिला</option>
                  </select>
                </div>
            </div>
        </>
      )}

      {step === 2 && (
        <>
            {/* Language Selection */}
            <div className="relative" ref={languageDropdownRef}>
                <label className="block text-md font-medium text-slate-700 dark:text-slate-300 mb-2">
                    आप कौन सी भाषाएँ बोलते हैं? <span className="text-red-500">*</span>
                </label>
                <button
                    type="button"
                    onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
                    className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 transition text-left flex justify-between items-center"
                    aria-haspopup="listbox"
                    aria-expanded={languageDropdownOpen}
                >
                    <span className={`truncate ${formData.languages.length > 0 ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}>
                        {formData.languages.length > 0
                            ? `${formData.languages.length} ${formData.languages.length > 1 ? 'भाषाएँ' : 'भाषा'} चुनी गईं`
                            : 'भाषा चुनें'}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-slate-400 transition-transform ${languageDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
                {languageDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto" role="listbox">
                        <div className="p-2 space-y-1">
                            {LANGUAGES.map(lang => (
                                <label key={lang.value} htmlFor={`lang-${lang.value}`} className="flex items-center p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        id={`lang-${lang.value}`}
                                        name="languages"
                                        value={lang.value}
                                        checked={formData.languages.includes(lang.value)}
                                        onChange={handleLanguageChange}
                                        className="h-4 w-4 rounded border-slate-400 dark:border-slate-600 text-cyan-600 focus:ring-cyan-500 bg-slate-100 dark:bg-slate-800"
                                    />
                                    <span className="ml-3 text-sm text-slate-700 dark:text-slate-300 select-none">
                                        {lang.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">कम से कम एक भाषा चुनें।</p>
            </div>


            {/* Payment Details */}
            <fieldset className="border border-slate-300 dark:border-slate-700 rounded-lg p-4">
              <legend className="px-2 font-semibold text-slate-700 dark:text-slate-300">भुगतान के लिए बैंक/UPI विवरण <span className="text-red-500">*</span></legend>
              <div className="space-y-4 mt-2">
                  <input type="text" name="bankAccount" value={formData.bankAccount} onChange={handleChange} placeholder="बैंक खाता संख्या" className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 transition"/>
                  <div className="grid grid-cols-2 gap-4">
                      <input type="text" name="ifsc" value={formData.ifsc} onChange={handleChange} placeholder="IFSC कोड" className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 transition"/>
                      <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} placeholder="बैंक का नाम" className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 transition"/>
                  </div>
                  <div className="flex items-center">
                      <hr className="flex-grow border-slate-300 dark:border-slate-700" />
                      <span className="px-4 text-slate-500">या</span>
                      <hr className="flex-grow border-slate-300 dark:border-slate-700" />
                  </div>
                  <input type="text" name="upiId" value={formData.upiId} onChange={handleChange} placeholder="UPI ID" className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 transition"/>
              </div>
            </fieldset>
        </>
      )}
      
      {error && <p className="text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/50 p-3 rounded-lg text-center font-medium">{error}</p>}
      
      <div className="grid grid-cols-2 gap-4">
        {step === 2 && (
            <button
                type="button"
                onClick={() => { setStep(1); setError(''); }}
                className="w-full bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-3 px-6 rounded-lg hover:bg-slate-400 dark:hover:bg-slate-600 transition-colors"
            >
                Back
            </button>
        )}
        
        {step === 1 ? (
            <button
                type="button"
                onClick={handleNext}
                className="w-full bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-cyan-700 transition-colors shadow-lg col-span-2"
            >
                Next
            </button>
        ) : (
            <button
                type="submit"
                disabled={loading}
                className="w-full bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-cyan-700 transition-colors shadow-lg disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
                {loading ? 'जमा हो रहा है...' : 'आवेदन भेजें'}
            </button>
        )}
      </div>
    </form>
  );
};

export default ApplyAsListener;
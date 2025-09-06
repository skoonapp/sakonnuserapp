import React, { useState } from 'react';

interface ContactProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Contact: React.FC<ContactProps> = ({ isOpen, onToggle }) => {
  const [formData, setFormData] = useState({ name: '', email: '', mobile: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('कृपया अपना नाम भरें।');
      setStatus('error');
      return;
    }
    if (!/^\d{10}$/.test(formData.mobile.trim())) {
      setError('कृपया एक मान्य 10-अंकीय मोबाइल नंबर दर्ज करें।');
      setStatus('error');
      return;
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
        setError('कृपया एक मान्य ईमेल पता दर्ज करें।');
        setStatus('error');
        return;
    }
    if (!formData.message.trim()) {
        setError('कृपया अपना संदेश लिखें।');
        setStatus('error');
        return;
    }

    setError('');
    setStatus('submitting');

    setTimeout(() => {
      console.log('Form submitted (simulated):', {
        ...formData,
        sendTo: 'appsakoon@gmail.com'
      });
      setStatus('success');
      setFormData({ name: '', email: '', mobile: '', message: '' });
    }, 1500);
  };

  if (status === 'success') {
    return (
      <div id="contact" className="p-6">
          <div className="max-w-xl mx-auto bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/30 p-8 rounded-lg shadow-md text-center">
            <h2 className="text-3xl font-bold text-teal-700 dark:text-teal-300 mb-3">धन्यवाद!</h2>
            <p className="text-lg text-teal-600 dark:text-teal-400">आपका संदेश सफलतापूर्वक भेज दिया गया है। हम जल्द ही आपसे संपर्क करेंगे।</p>
          </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center text-left p-6"
        aria-expanded={isOpen}
      >
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">अपना संदेश भेजें</h2>
          <p className="text-slate-500 dark:text-slate-400">कोई सवाल या सुझाव है? हमें बताएं।</p>
        </div>
        <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      
      <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0'} overflow-hidden`}>
        <div className="p-6 pt-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-md font-medium text-slate-700 dark:text-slate-300 mb-2">नाम <span className="text-red-500">*</span></label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition text-slate-900 dark:text-white" placeholder="आपका पूरा नाम" />
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
                 <div>
                    <label htmlFor="email" className="block text-md font-medium text-slate-700 dark:text-slate-300 mb-2">ईमेल <span className="text-red-500">*</span></label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition text-slate-900 dark:text-white" placeholder="आपका ईमेल पता" />
                </div>
                <div>
                    <label htmlFor="mobile" className="block text-md font-medium text-slate-700 dark:text-slate-300 mb-2">मोबाइल नंबर <span className="text-red-500">*</span></label>
                    <input type="tel" id="mobile" name="mobile" value={formData.mobile} onChange={handleChange} required maxLength={10} className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition text-slate-900 dark:text-white" placeholder="10-अंकीय मोबाइल नंबर" />
                </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-md font-medium text-slate-700 dark:text-slate-300 mb-2">संदेश <span className="text-red-500">*</span></label>
              <textarea id="message" name="message" value={formData.message} onChange={handleChange} required rows={5} className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition text-slate-900 dark:text-white" placeholder="आपका संदेश यहाँ लिखें..."></textarea>
            </div>
            
            {status === 'error' && <p className="text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/50 p-3 rounded-lg text-center">{error}</p>}
            
            <div className="text-center">
              <button 
                type="submit" 
                disabled={status === 'submitting'}
                className="bg-cyan-600 text-white font-bold py-3 px-10 rounded-full text-lg hover:bg-cyan-700 transition-colors shadow-lg disabled:bg-slate-400 disabled:cursor-not-allowed"
              >
                {status === 'submitting' ? 'भेज रहा है...' : 'भेजें'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default React.memo(Contact);
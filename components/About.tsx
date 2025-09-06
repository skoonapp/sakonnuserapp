import React, { useState } from 'react';
import type { User } from '../types';
import FAQ from './FAQ';
import Contact from './Contact';
import Testimonials from './Testimonials';
import ApplyAsListener from './ApplyAsListener';

interface ProfileViewProps {
  currentUser: User;
  onShowTerms: () => void;
  onShowPrivacyPolicy: () => void;
  onShowCancellationPolicy: () => void;
  deferredPrompt: any; // The event from beforeinstallprompt
  onInstallClick: () => void;
  onLogout: () => void;
}

// --- Icons ---
const InstallIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 1.5a.75.75 0 01.75.75V12h-1.5V2.25A.75.75 0 0112 1.5z" />
        <path fillRule="evenodd" d="M3.75 13.5a.75.75 0 00-1.5 0v4.5a3 3 0 003 3h10.5a3 3 0 003-3v-4.5a.75.75 0 00-1.5 0v4.5a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-4.5zm5.03-3.03a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l2.25-2.25a.75.75 0 10-1.06-1.06L12 12.69 8.78 9.47z" clipRule="evenodd" />
    </svg>
);

const LogoutIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm10.72 4.72a.75.75 0 011.06 0l3 3a.75.75 0 010 1.06l-3 3a.75.75 0 11-1.06-1.06l1.72-1.72H9a.75.75 0 010-1.5h10.94l-1.72-1.72a.75.75 0 010-1.06z" clipRule="evenodd" />
  </svg>
);
// --- End Icons ---


const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onShowTerms,
  onShowPrivacyPolicy,
  onShowCancellationPolicy,
  deferredPrompt,
  onInstallClick,
  onLogout,
}) => {
  const [openAccordion, setOpenAccordion] = useState<'faq' | 'contact' | null>(null);

  const handleAccordionToggle = (section: 'faq' | 'contact') => {
      setOpenAccordion(prev => (prev === section ? null : section));
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-4 pt-2 pb-6 space-y-6">
        <div className="border-b border-slate-200 dark:border-slate-700"></div>

        {/* Highlighted Apply as Listener Section */}
        <section id="apply" className="py-3 bg-gradient-to-br from-cyan-50 to-blue-100 dark:from-cyan-950/50 dark:to-blue-950/50 rounded-xl shadow-lg border-2 border-cyan-200 dark:border-cyan-600">
          <div className="container mx-auto px-6">
            <div className="text-center mb-3">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Listener बनें – दूसरों की मदद करें और कमाएँ!
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mt-1">
                क्या आप दूसरों की सुनना पसंद करते हैं? हमारे GROUP में शामिल हों और अपने जीवन में बदलाव लाएँ।
              </p>
              <p className="mt-2 text-base font-semibold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-500/10 inline-block px-3 py-1.5 rounded-full border border-green-200 dark:border-green-500/30">
                💰 10,000–15,000 रु. महीना कमाएँ।
              </p>
            </div>
            <div className="max-w-xl mx-auto">
              <ApplyAsListener />
            </div>
          </div>
        </section>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md divide-y divide-slate-200 dark:border-slate-700">
            {/* About Section */}
            <div className="p-6">
                <section id="about">
                  <div className="container mx-auto">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 text-center sm:text-left">
                        हमारे बारे में
                      </h2>
                    </div>
                    <p className="text-base text-slate-600 dark:text-slate-400 max-w-3xl mx-auto text-center leading-relaxed">
                      SakoonApp एक सुरक्षित और गोपनीय स्थान है जहाँ आप अपनी भावनाओं को साझा कर सकते हैं। हमारा लक्ष्य मानसिक स्वास्थ्य और भावनात्मक समर्थन को सभी के लिए सुलभ बनाना है।
                    </p>
                  </div>
                  <Testimonials />
                </section>
            </div>

            {/* Install App Section */}
            {deferredPrompt && (
              <div className="p-6">
                  <section id="install-app" className="text-center">
                    <div className="container mx-auto">
                      <h3 className="text-xl md:text-2xl font-bold text-slate-700 dark:text-slate-100 mb-4">एक क्लिक में इंस्टॉल करें</h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                        SakoonApp को अपनी होम स्क्रीन पर जोड़ें ताकि आप इसे आसानी से और तेज़ी से इस्तेमाल कर सकें।
                      </p>
                      <button 
                        onClick={onInstallClick} 
                        className="flex w-full max-w-xs mx-auto justify-center items-center gap-3 bg-cyan-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-cyan-700 transition-colors shadow-lg transform hover:scale-105"
                      >
                        <InstallIcon className="w-6 h-6"/>
                        <span>ऐप इंस्टॉल करें</span>
                      </button>
                    </div>
                  </section>
              </div>
            )}
            
            {/* New Combined FAQ and Contact Section */}
            <div className="p-6">
                <div className="max-w-2xl mx-auto bg-slate-50 dark:bg-slate-900/50 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <FAQ
                        isOpen={openAccordion === 'faq'}
                        onToggle={() => handleAccordionToggle('faq')}
                    />
                    <div className="border-t border-slate-200 dark:border-slate-800"></div>
                    <Contact
                        isOpen={openAccordion === 'contact'}
                        onToggle={() => handleAccordionToggle('contact')}
                    />
                </div>
            </div>
            
            <div className="p-6 text-center">
              <div className="flex justify-center items-center">
                  <button
                      onClick={onLogout}
                      className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                  >
                      <LogoutIcon className="w-5 h-5" />
                      <span>लॉगआउट</span>
                  </button>
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                 <h3 className="text-xl font-bold text-slate-700 dark:text-slate-100 mb-4">App & Policies</h3>
                 <div className="flex flex-col sm:flex-row justify-center items-center flex-wrap gap-4">
                    <button onClick={onShowTerms} className="text-cyan-600 dark:text-cyan-300 font-semibold hover:underline">Terms & Conditions</button>
                    <button onClick={onShowPrivacyPolicy} className="text-cyan-600 dark:text-cyan-300 font-semibold hover:underline">Privacy Policy</button>
                    <button onClick={onShowCancellationPolicy} className="text-cyan-600 dark:text-cyan-300 font-semibold hover:underline">Cancellation/Refund Policy</button>
                </div>
              </div>

               <footer className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    © 2025 SakoonApp. All Rights Reserved.
                  </p>
                </footer>
            </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ProfileView);
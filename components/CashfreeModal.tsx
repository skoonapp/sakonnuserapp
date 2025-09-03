import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    Cashfree: any;
  }
}

interface CashfreeModalProps {
  orderToken: string;
  onClose: (status: 'success' | 'failure' | 'closed') => void;
}

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);


const CashfreeModal: React.FC<CashfreeModalProps> = ({ orderToken, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isClosedRef = useRef(false);

  useEffect(() => {
    if (!window.Cashfree) {
      console.error("Cashfree SDK not loaded");
      onClose('failure');
      return;
    }

    if (!containerRef.current) return;

    try {
      const cashfree = new window.Cashfree(orderToken);
      const dropinConfig = {
        components: [
            "order-details",
            "card",
            "upi",
            "app",
            "netbanking",
        ],
        // The 'onSuccess' and 'onFailure' are crucial for providing immediate feedback.
        // The backend webhook remains the ultimate source of truth for crediting the user.
        onSuccess: (data: any) => {
            console.log('Cashfree success:', data);
            if (!isClosedRef.current) {
                isClosedRef.current = true;
                onClose('success');
            }
        },
        onFailure: (data: any) => {
            console.error('Cashfree failure:', data);
             if (!isClosedRef.current) {
                isClosedRef.current = true;
                onClose('failure');
            }
        },
        // Using style options to match the app's theme.
        style: {
            theme: document.documentElement.classList.contains('dark') ? "dark" : "light",
            backgroundColor: document.documentElement.classList.contains('dark') ? "#0f172a" : "#f1f5f9",
            color: document.documentElement.classList.contains('dark') ? "#f8fafc" : "#0f172a",
            fontFamily: "Poppins, sans-serif",
            fontSize: "14px",
            errorColor: "#ef4444",
            themeColor: "#0891B2",
        }
      };
      
      // Render the payment UI inside our modal container.
      cashfree.drop(containerRef.current, dropinConfig);
      setIsLoading(false);

    } catch (error) {
        console.error("Error initializing Cashfree drop-in UI", error);
        onClose('failure');
    }
  }, [orderToken, onClose]);

  const handleManualClose = () => {
    if (!isClosedRef.current) {
        isClosedRef.current = true;
        onClose('closed');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={handleManualClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">Complete Your Payment</h2>
            <button onClick={handleManualClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
                <CloseIcon className="w-6 h-6" />
            </button>
        </div>
        
        {isLoading && (
            <div className="h-96 flex items-center justify-center">
                <div className="text-cyan-600 dark:text-cyan-400 flex flex-col items-center">
                    <svg className="animate-spin h-8 w-8 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p>Loading Secure Gateway...</p>
                </div>
            </div>
        )}

        <div ref={containerRef} className="p-2" style={{minHeight: isLoading ? 0 : '24rem'}}>
            {/* Cashfree Drop-in UI will render here */}
        </div>
      </div>
    </div>
  );
};

export default CashfreeModal;
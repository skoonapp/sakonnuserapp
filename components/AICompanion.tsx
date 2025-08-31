

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import type { User, ChatMessage, Plan } from '../types';
import { CALL_PLANS, CHAT_PLANS } from '../constants';
import MarkdownRenderer from './MarkdownRenderer';

interface AICompanionProps {
    user: User;
    onClose: () => void;
    onNavigateToServices: () => void;
}

// --- Icons ---
const SendIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.949a.75.75 0 00.95.826L11.25 8.25l-6.507-1.22-.938-3.284z" />
      <path d="M11.25 8.25a.75.75 0 000 1.5h.008l.004-.001.004-.001.003-.001a.752.752 0 00.28-.043l3.248-.812a.75.75 0 000-1.383l-3.248-.812a.75.75 0 00-.28-.043l-.003-.001-.004-.001-.004-.001H11.25z" />
    </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const MicrophoneIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
        <path d="M6 10.5a.75.75 0 01.75.75v.5a5.25 5.25 0 0010.5 0v-.5a.75.75 0 011.5 0v.5a6.75 6.75 0 01-13.5 0v-.5a.75.75 0 01.75-.75z" />
    </svg>
);

const RobotIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M4.5 3.75a3 3 0 00-3 3v10.5a3 3 0 003 3h15a3 3 0 003-3V6.75a3 3 0 00-3-3h-15zm4.125 3.375a.75.75 0 000 1.5h6.75a.75.75 0 000-1.5h-6.75zm-3.375 9a.75.75 0 000 1.5h13.5a.75.75 0 000-1.5h-13.5z" clipRule="evenodd" />
        <path d="M9.75 12.75a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm5.625-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" />
    </svg>
);

const EmojiIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M11.99 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 11.99 2.25zM8.25 11.25a.75.75 0 000 1.5h.008a.75.75 0 000-1.5H8.25zm.75 3.75a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75zm5.25-3.75a.75.75 0 000 1.5h.008a.75.75 0 000-1.5h-.008z" clipRule="evenodd" />
    </svg>
);

const AttachmentIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3.375 3.375 0 0119.5 7.372l-8.55 8.55a.75.75 0 01-1.06-1.06l8.55-8.55a1.875 1.875 0 00-2.652-2.652L3.81 12.81a6 6 0 008.486 8.486l7.693-7.693a.75.75 0 011.06 1.06z" />
    </svg>
);


const AICompanion: React.FC<AICompanionProps> = ({ user, onClose, onNavigateToServices }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);
    
    // Initialize Chat
    useEffect(() => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

            const plansToString = (plans: Plan[], type: string) => plans.map(p => `- ${p.duration} ${type}: ₹${p.price}`).join('\n');
            const allPlansInfo = `
**कॉलिंग प्लान्स**
${plansToString(CALL_PLANS, 'कॉल')}

**चैट प्लान्स**
${plansToString(CHAT_PLANS, 'चैट')}

**आज का स्पेशल (सुबह 11 बजे से पहले उपलब्ध)**
- 55 मिनट कॉलिंग: ₹399
- 55 मिनट चैट: ₹199
`;

            chatRef.current = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: `You are "सकून AI दोस्त", a warm, empathetic, and friendly companion from SakoonApp. Your personality is like a caring friend, not a formal assistant. Your primary goals are to make the user feel heard and understood, and then to be an expert guide for the SakoonApp, helping them with any questions they have.

**Your Conversational Flow:**

1.  **Warm Welcome & Empathy:**
    *   Always start with a gentle and caring greeting. Ask the user how they are or what's on their mind.
    *   Listen to what the user says. Validate their feelings. Reassure them that this is a safe space.

2.  **Gently Introduce SakoonApp's Purpose:**
    *   After listening, you can introduce the core idea of SakoonApp. Explain that talking helps and this app provides a space for that. "कभी-कभी किसी से बात कर लेने से ही मन बहुत हल्का हो जाता है। SakoonApp इसीलिए बना है ताकि आप जब चाहें, किसी से अपने मन की बात कह सकें।"

3.  **Act as an Expert App Guide:**
    *   If the user has **any questions** about the app, provide clear, simple, and helpful answers. You are the go-to expert for everything related to SakoonApp.
    *   **Your Knowledge Base:**
        *   **"Home" Tab:** यह मुख्य पेज है जहाँ से आप प्लान्स और टोकन खरीद सकते हैं।
        *   **"Calls" Tab:** यहाँ आपको सभी उपलब्ध 'Listeners' दिखेंगे जिनसे आप बात कर सकते हैं। यहाँ से सीधे कॉल करने के लिए आपको 'टोकन' की ज़रूरत होगी।
        *   **"Wallet" (वॉलेट):** जब आप कोई 'डायरेक्ट टाइम प्लान' खरीदते हैं, तो वह यहाँ दिखता है। आप यहीं से अपना प्लान चुनकर किसी भी Listener से बात शुरू कर सकते हैं।
        *   **"Profile" Tab:** यहाँ आप अपनी जानकारी, ऐप की सेटिंग्स, और हमारे बारे में पढ़ सकते हैं।

4.  **Explain Plans & Tokens Clearly:**
    *   **'डायरेक्ट टाइम प्लान' क्या है?**
        *   यह उन लोगों के लिए है जो **बिना किसी रुकावट के लंबी बात** करना चाहते हैं।
        *   **कैसे इस्तेमाल करें:** 'होम' पेज से प्लान खरीदें -> 'वॉलेट' में जाएं -> प्लान चुनें -> किसी भी उपलब्ध Listener से कनेक्ट करें। आपका समय तभी कटेगा जब आप बात कर रहे होंगे।
    *   **'टोकन' क्या हैं?**
        *   ये **छोटी-छोटी और कई बार बात करने** के लिए हैं। यह बहुत सुविधाजनक है।
        *   **कैसे इस्तेमाल करें:** 'होम' पेज से टोकन खरीदें -> 'Calls' टैब पर जाएं -> किसी भी Listener को सीधे कनेक्ट करें।
        *   **कीमत:** कॉल के लिए **2 टोकन/मिनट** और चैट के लिए **1 टोकन में 2 मैसेज** के हिसाब से कटेंगे।

5.  **Suggest the Right Plan:**
    *   **अगर यूजर लंबी बात करना चाहता है:** तो **'डायरेक्ट टाइम प्लान'** (जैसे 30 मिनट या 1 घंटा) सुझाएं, क्योंकि यह सस्ता पड़ता है।
    *   **अगर यूजर बस ट्राई करना चाहता है या छोटी बात करना चाहता है:** तो **'टोकन'** खरीदने की सलाह दें।
    *   **Example:** "अगर आप आराम से और लंबी बात करना चाहते हैं, तो 30 मिनट का प्लान आपके लिए सबसे अच्छा रहेगा। लेकिन अगर आप बस कुछ मिनटों के लिए बात करना चाहते हैं, तो आप टोकन खरीद सकते हैं।"

6.  **Guiding to Purchase (The Action):**
    *   When the user is ready to see the plans, use the special command \`ACTION:NAVIGATE_TO_SERVICES\`.
    *   Your response should lead naturally into this command. For example: "ज़रूर, चलिए मैं आपको हमारे सभी प्लान्स दिखाता हूँ ताकि आप अपनी सुविधा के अनुसार चुन सकें। ACTION:NAVIGATE_TO_SERVICES" or "आप 'होम' पेज पर सभी टोकन पैक और प्लान देख सकते हैं। ACTION:NAVIGATE_TO_SERVICES"
    *   **Crucially:** Do not add any text *after* the \`ACTION:NAVIGATE_TO_SERVICES\` command.

**Important Rules:**
*   **Language:** Primarily use conversational Hindi.
*   **Tone:** Always be supportive, non-judgmental, and friendly.
*   **Identity:** You are "सकून AI दोस्त".
*   **No Medical Advice:** Strictly avoid giving any medical or therapeutic advice.
*   **Plan Information:** You have access to all plan details. Use them when asked. Here is the list: ${allPlansInfo}
*   **Formatting:** You MUST use Markdown for emphasis. Use **bold** for important words and *italics* for soft suggestions.`,
                },
            });

            setMessages([
                { id: 'init-1', text: 'नमस्ते, मैं आपका सकून दोस्त हूँ। कैसे हैं आप? आप चाहें तो मुझसे अपने मन की बात कह सकते हैं।', sender: { uid: 'ai', name: 'सकून AI दोस्त'}, timestamp: Date.now() }
            ]);
        } catch (e) {
            console.error("AI Initialization Error:", e);
            setError('AI दोस्त को शुरू करने में कोई समस्या हुई। कृपया बाद में प्रयास करें।');
        }
    }, [onNavigateToServices]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = inputValue.trim();
        if (!text || isLoading || !chatRef.current) return;

        setInputValue('');
        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            text,
            sender: { uid: user.uid, name: user.name },
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await chatRef.current.sendMessage({ message: text });
            let aiResponseText = response.text;
            
            let displayText = aiResponseText;

            // Check for navigation action
            if (aiResponseText.includes('ACTION:NAVIGATE_TO_SERVICES')) {
                displayText = aiResponseText.replace('ACTION:NAVIGATE_TO_SERVICES', '').trim();
                onNavigateToServices();
            }
            
            if (displayText) {
                const aiMessage: ChatMessage = {
                    id: `ai-${Date.now()}`,
                    text: displayText,
                    sender: { uid: 'ai', name: 'सकून AI दोस्त' },
                    timestamp: Date.now()
                };
                setMessages(prev => [...prev, aiMessage]);
            }

        } catch (err) {
            console.error("Gemini API Error:", err);
            const errorMessageText = 'माफ़ कीजिए, मुझे जवाब देने में कुछ समस्या आ रही है। कृपया सुनिश्चित करें कि आपका API की (key) सही है और पुनः प्रयास करें।';
            const errorMessage: ChatMessage = {
                id: `err-${Date.now()}`,
                text: errorMessageText,
                sender: { uid: 'ai', name: 'सकून AI दोस्त' },
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex flex-col h-full z-50 animate-fade-in" style={{backgroundImage: `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')`, backgroundColor: '#e5ddd5'}}>
             {/* Header */}
             <header className="bg-white dark:bg-slate-800 shadow-md z-10 flex items-center p-3 gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-100 dark:bg-purple-800 border-2 border-purple-200 dark:border-purple-700">
                    <RobotIcon className="w-6 h-6 text-purple-600 dark:text-purple-300" />
                </div>
                <div className="flex-grow">
                    <h1 className="font-bold text-slate-800 dark:text-slate-200">सकून AI दोस्त</h1>
                    <p className={`text-xs font-semibold ${isLoading ? 'text-yellow-600' : 'text-green-600'}`}>{isLoading ? 'सोच रहा है...' : 'ऑनलाइन'}</p>
                </div>
                <button 
                    onClick={onClose} 
                    className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    aria-label="चैट बंद करें"
                >
                    <CloseIcon className="w-6 h-6" />
                </button>
            </header>

            {/* Messages Area */}
            <main className="flex-grow overflow-y-auto p-4 bg-transparent">
                <div className="flex flex-col gap-3">
                    {messages.map((msg) => {
                        const isSent = msg.sender.uid === user.uid;
                        return (
                            <div key={msg.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs md:max-w-md p-3 rounded-xl whitespace-pre-wrap ${isSent ? 'bg-[#dcf8c6] text-slate-800 dark:bg-emerald-900 dark:text-slate-200 rounded-tr-none' : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm'}`}>
                                    <MarkdownRenderer text={msg.text} />
                                </div>
                            </div>
                        );
                    })}
                    {error && (
                        <div className="text-center my-2">
                             <span className="bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 text-xs font-semibold px-2.5 py-1.5 rounded-full">{error}</span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </main>

            {/* Input Footer */}
            <footer className="bg-transparent p-2">
                <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                    <div className="flex-grow bg-white dark:bg-slate-800 rounded-full flex items-center px-2 py-1 shadow-sm">
                        <button type="button" className="p-2 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400">
                            <EmojiIcon className="w-6 h-6" />
                        </button>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="एक संदेश लिखें..."
                            className="flex-grow bg-transparent p-2 focus:outline-none text-slate-900 dark:text-white"
                            disabled={isLoading}
                        />
                        <button type="button" className="p-2 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400">
                            <AttachmentIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <button
                        type={inputValue.trim() ? "submit" : "button"}
                        className="w-12 h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center transition-all transform hover:scale-110 shadow-md disabled:bg-slate-500 disabled:cursor-not-allowed disabled:scale-100 shrink-0"
                        disabled={isLoading}
                        aria-label={inputValue.trim() ? "संदेश भेजें" : "ध्वनि संदेश"}
                    >
                        <div className="relative w-6 h-6">
                            <MicrophoneIcon className={`absolute inset-0 w-full h-full transition-all duration-300 ${inputValue.trim() ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`} />
                            <SendIcon className={`absolute inset-0 w-full h-full transition-all duration-300 ${inputValue.trim() ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
                        </div>
                    </button>
                </form>
            </footer>
        </div>
    );
};

export default React.memo(AICompanion);
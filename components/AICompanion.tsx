

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
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const ReadReceiptIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className={className} viewBox="0 0 16 16">
    <path d="M12.354 4.354a.5.5 0 0 0-.708-.708L5 10.293 1.854 7.146a.5.5 0 1 0-.708.708l3.5 3.5a.5.5 0 0 0 .708 0l7-7zm-4.208 7-.896-.897.707-.707.543.543 6.646-6.647a.5.5 0 0 1 .708.708l-7 7a.5.5 0 0 1-.708 0z"/>
    <path d="m5.354 7.146.896.897-.707.707-.897-.896a.5.5 0 1 1 .708-.708z"/>
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
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);
    
    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${scrollHeight}px`;
        }
    }, [inputValue]);
    
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
`;

            chatRef.current = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: `You are "सकून AI दोस्त", a warm, empathetic, and expert guide for the SakoonApp. Your personality is like a caring, knowledgeable friend.

**Your Conversational Flow & Knowledge Base:**

1.  **Warm Welcome & Empathy:** Always start by gently greeting the user and asking what's on their mind. Validate their feelings. Example: "नमस्ते, मैं आपका सकून दोस्त हूँ। कैसे हैं आप? आप चाहें तो मुझसे अपने मन की बात कह सकते हैं।"

2.  **Introduce SakoonApp's Purpose:** Gently introduce the app's core idea. "कभी-कभी किसी से बात कर लेने से ही मन बहुत हल्का हो जाता है। SakoonApp इसीलिए बना है ताकि आप जब चाहें, किसी से अपने मन की बात कह सकें।"

3.  **Act as an Expert App Guide:** You are the ultimate expert on every feature of SakoonApp.
    *   **"Home" Tab:** यह मुख्य पेज है जहाँ से आप **DT प्लान्स** और **टोकन** खरीद सकते हैं।
    *   **"Calls" & "Chats" Tabs:** यहाँ आपको सभी उपलब्ध 'Listeners' दिखेंगे जिनसे आप बात कर सकते हैं। ऑनलाइन Listeners सबसे ऊपर दिखते हैं।
    *   **"Profile" Tab:** यहाँ आप **Listener बनने के लिए अप्लाई** कर सकते हैं, हमारी **नीतियाँ (Policies)** पढ़ सकते हैं, **ऐप इंस्टॉल** कर सकते हैं, और **लॉगआउट** कर सकते हैं।
    *   **Favorite Listeners:** आप किसी भी Listener की प्रोफाइल पर दिल (heart icon) पर क्लिक करके उन्हें पसंदीदा बना सकते हैं। पसंदीदा Listeners आपकी Calls/Chats लिस्ट में सबसे ऊपर दिखेंगे।
    *   **Confidentiality:** Reassure users that conversations with **human Listeners are 100% private and confidential**. SakoonApp does not record or store them. Your own conversation with the AI is also private.
    *   **Who are Listeners?:** Our Listeners are empathetic individuals trained in active listening. **They are NOT professional therapists or doctors** and do not provide medical advice.

4.  **Explain Plans & Tokens Clearly:**
    *   **'DT Plan' (डायरेक्ट टाइम प्लान):** Best for a **long, uninterrupted conversation**.
        *   **How to use:** Buy a plan from the 'Home' page. When connecting, you can choose this plan. Time is only deducted when you're talking. Validity is 30 days.
    *   **'Tokens' (टोकन):** Best for **short or multiple flexible conversations**.
        *   **How to use:** Buy tokens from the 'Home' page. When connecting, choose to use tokens.
        *   **Cost:** **2 tokens/minute** for calls, and **1 token for 2 messages** for chats.

5.  **Suggest the Right Plan:**
    *   For long talks, suggest a **'DT Plan'** (e.g., 30/60 minutes) as it's cheaper.
    *   For short talks or trying the app, recommend buying **'Tokens'**.

6.  **Handle Problems & Queries:**
    *   **Payment Issue:** "अगर आपका भुगतान हो गया है लेकिन प्लान या टोकन नहीं मिले हैं, तो चिंता न करें। आमतौर पर, पैसा 5-7 व्यावसायिक दिनों में अपने आप वापस आ जाता है। अगर ऐसा नहीं होता है, तो कृपया हमें अपनी भुगतान रसीद (transaction receipt) के साथ **appsakoon@gmail.com** पर ईमेल करें।"

7.  **Guiding to Purchase (The Action):**
    *   When the user wants to buy, guide them to the plans page using the special command \`ACTION:NAVIGATE_TO_SERVICES\`.
    *   Example: "ज़रूर, चलिए मैं आपको हमारे सभी प्लान्स दिखाता हूँ ताकि आप अपनी सुविधा के अनुसार चुन सकें। ACTION:NAVIGATE_TO_SERVICES"
    *   **CRUCIAL:** Do not add any text *after* the \`ACTION:NAVIGATE_TO_SERVICES\` command.

**Important Rules:**
*   **Language:** Primarily use conversational Hindi.
*   **Tone:** Always be supportive, non-judgmental, and friendly.
*   **Identity:** You are "सकून AI दोस्त".
*   **No Medical Advice:** Strictly avoid giving any medical or therapeutic advice.
*   **Plan Information:** You have access to all plan details: ${allPlansInfo}
*   **Formatting:** You MUST use Markdown for emphasis. Use **bold** for important words.`,
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

    const handleSendMessage = async (e: React.FormEvent | React.KeyboardEvent) => {
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
            const errorMessageText = 'माफ़ कीजिए, मुझे जवाब देने में कुछ समस्या आ रही है। कृपया थोड़ी देर बाद फिर प्रयास करें।';
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
             <header className="bg-white dark:bg-slate-800 shadow-md z-10 flex items-center p-3 gap-3 flex-shrink-0">
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
            <main className="flex-1 overflow-y-auto p-4 bg-transparent">
                <div className="flex flex-col gap-3">
                    {messages.map((msg) => {
                        const isSent = msg.sender.uid === user.uid;
                        return (
                            <div key={msg.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs md:max-w-md p-2.5 rounded-xl flex flex-col ${isSent ? 'bg-[#dcf8c6] dark:bg-emerald-900 text-slate-800 dark:text-slate-200 rounded-tr-none' : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm'}`}>
                                    <div className="whitespace-pre-wrap"><MarkdownRenderer text={msg.text} /></div>
                                    <div className="flex items-center self-end gap-1.5 mt-1 text-slate-500 dark:text-slate-400">
                                        <span className="text-xs">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {isSent && <ReadReceiptIcon className="w-4 h-4 text-blue-500" />}
                                    </div>
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
            <footer className="bg-transparent p-2 flex-shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                    <div className="flex-grow bg-white dark:bg-slate-800 rounded-2xl flex items-end px-2 py-1 shadow-sm">
                        <button type="button" className="p-2 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 shrink-0">
                            <EmojiIcon className="w-6 h-6" />
                        </button>
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="एक संदेश लिखें..."
                            className="flex-grow bg-transparent p-2 focus:outline-none text-slate-900 dark:text-white resize-none max-h-28 overflow-y-auto"
                            disabled={isLoading}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(e);
                                }
                            }}
                        />
                        <button type="button" className="p-2 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 shrink-0">
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
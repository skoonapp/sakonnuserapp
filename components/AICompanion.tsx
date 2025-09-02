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
    *   **"Profile" Tab:** यहाँ आप अपनी प्रोफाइल देख सकते हैं, ऐप इंस्टॉल कर सकते हैं, और हमारी नीतियां पढ़ सकते हैं।

4.  **Understand Plans & Tokens:**
    *   **DT Plans vs. Tokens:** DT (Direct Time) plans (like a 30-min call plan) are always used first if you have one. Tokens are only used when you don't have an active DT plan. This is automatic.
    *   **Costs:** Calls cost **2 tokens/minute**. Chats cost **1 token per 2 messages**.
    *   **All Plans Info:** Here are the current plans available for purchase:
${allPlansInfo}

5.  **Guide and Encourage:** If the user seems ready, gently guide them towards using the app's main features. Example: "जब भी आप तैयार हों, आप 'Calls' या 'Chats' टैब पर जाकर किसी Listener से बात कर सकते हैं।" Use the 'onNavigateToServices' function if the user wants to see the listeners.

**Your Core Directives:**

*   **Primary Goal:** Your main job is to make the user feel comfortable, understand how the app works, and guide them to connect with a human Listener. You are a guide, not a replacement for a Listener.
*   **NEVER Role-play:** Do not act as a Listener yourself. Do not engage in deep therapeutic conversations. If a user starts sharing deep personal issues, gently guide them. Example: "यह सुनने में बहुत कठिन लग रहा है। हमारे एक Listener से इस बारे में बात करना शायद आपके लिए मददगार हो सकता है। वे सुनने के लिए प्रशिक्षित हैं। क्या आप चाहेंगे कि मैं आपको 'Services' पेज पर ले चलूँ?"
*   **Function Calling:** If the user expresses a clear intent to talk to a Listener (e.g., "I want to talk to someone," "Find me a listener"), use the 'navigateToServices' tool.
*   **Language:** Converse primarily in Hinglish (Hindi using the Roman script) or Hindi (Devanagari script), matching the user's language. Be natural and friendly.
*   **Keep it Concise:** Your answers should be helpful but not overly long.
`,
                    // FIX: Moved 'tools' property inside the 'config' object.
                    tools: [{
                        functionDeclarations: [{
                            name: 'navigateToServices',
                            description: 'Navigates the user to the services (listeners) page.'
                        }]
                    }]
                },
            });
            
            setMessages([{
                id: `ai-welcome-${Date.now()}`,
                text: `नमस्ते ${user.name}, मैं आपका सकून AI दोस्त हूँ। मैं इस ऐप को समझने में आपकी मदद कर सकता हूँ। आप क्या जानना चाहेंगे?`,
                sender: { uid: 'ai', name: 'सकून दोस्त' },
                timestamp: Date.now()
            }]);

        } catch (err: any) {
            console.error("Gemini initialization error:", err);
            setError("AI Companion could not be initialized. Please try again later.");
        }
    }, [user, onNavigateToServices]);
    
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading || !chatRef.current) return;

        const text = inputValue.trim();
        setInputValue('');

        setMessages(prev => [...prev, {
            id: `user-${Date.now()}`,
            text: text,
            sender: { uid: user.uid, name: user.name || 'You' },
            timestamp: Date.now(),
            status: 'sent'
        }]);

        setIsLoading(true);
        setError(null);

        try {
            const result = await chatRef.current.sendMessage({ message: text });
            
            const functionCalls = result.candidates?.[0]?.content?.parts
                .filter(part => !!part.functionCall);

            if (functionCalls && functionCalls.length > 0) {
                 if (functionCalls[0].functionCall?.name === 'navigateToServices') {
                     onNavigateToServices();
                 }
            }
            
            setMessages(prev => [...prev, {
                id: `ai-${Date.now()}`,
                text: result.text,
                sender: { uid: 'ai', name: 'सकून दोस्त' },
                timestamp: Date.now(),
            }]);

        } catch (err: any) {
            console.error("Gemini API error:", err);
            setError("Sorry, I'm having trouble connecting right now. Please try again in a moment.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-100 dark:bg-slate-950 animate-fade-in-up transition-transform duration-300">
            <header className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 shadow-sm flex-shrink-0 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-cyan-500 to-teal-400 p-2 rounded-full">
                        <RobotIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">सकून AI दोस्त</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">आपका सहायक गाइड</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                    <CloseIcon className="w-6 h-6" />
                </button>
            </header>
    
            <main className="flex-grow p-4 overflow-y-auto">
                <div className="flex flex-col gap-4">
                    {messages.map((msg) => {
                        const isAI = msg.sender.uid === 'ai';
                        return (
                            <div key={msg.id} className={`flex items-end gap-2 ${!isAI ? 'flex-row-reverse' : ''}`}>
                                {isAI && (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-teal-400 flex items-center justify-center shrink-0">
                                        <RobotIcon className="w-5 h-5 text-white" />
                                    </div>
                                )}
                                <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${isAI ? 'bg-white dark:bg-slate-800 rounded-bl-none shadow-sm' : 'bg-cyan-500 text-white rounded-br-none'}`}>
                                    <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                                        <MarkdownRenderer text={msg.text} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {isLoading && (
                        <div className="flex items-end gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-teal-400 flex items-center justify-center shrink-0">
                                <RobotIcon className="w-5 h-5 text-white" />
                            </div>
                            <div className="max-w-xs md:max-w-md p-3 rounded-2xl bg-white dark:bg-slate-800 rounded-bl-none shadow-sm">
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    {error && <p className="text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/50 p-3 rounded-lg text-sm text-center">{error}</p>}
                </div>
                <div ref={messagesEndRef} />
            </main>
            
            <footer className="p-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex-shrink-0 border-t border-slate-200 dark:border-slate-800">
                <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                    <div className="flex-grow min-w-0 bg-white dark:bg-slate-800 rounded-2xl flex items-end px-3 py-1 shadow-inner">
                        <button type="button" className="p-2 text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400">
                            <EmojiIcon className="w-6 h-6"/>
                        </button>
                        <button type="button" className="p-2 text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400">
                            <AttachmentIcon className="w-6 h-6"/>
                        </button>
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="सकून दोस्त से पूछें..."
                            className="flex-grow bg-transparent p-2 focus:outline-none text-slate-900 dark:text-white resize-none max-h-28 overflow-y-auto"
                            disabled={isLoading}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(e);
                                }
                            }}
                        />
                    </div>
    
                    <button
                        type="submit"
                        disabled={isLoading || !inputValue.trim()}
                        className="w-12 h-12 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full flex items-center justify-center transition-all transform hover:scale-110 shadow-md disabled:bg-slate-500 disabled:cursor-not-allowed disabled:scale-100 shrink-0"
                        aria-label="Send message"
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

export default AICompanion;
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import type { User, ChatMessage, Plan, ChatMessageSender } from '../types';
import { CALL_PLANS, CHAT_PLANS } from '../constants';
import MarkdownRenderer from './MarkdownRenderer';

interface AICompanionProps {
    user: User;
    onClose: () => void;
    onNavigateToServices: () => void;
}

// --- Icons ---
const SendIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);
const ClockIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" /></svg>;
const DeliveredIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.953 4.136a.75.75 0 01.143 1.052l-5 6.5a.75.75 0 01-1.127.075l-2.5-2.5a.75.75 0 111.06-1.06l1.894 1.893 4.48-5.824a.75.75 0 011.052-.143z" clipRule="evenodd" /><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" /></svg>;
const ErrorIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>;
const MessageStatus: React.FC<{ status?: ChatMessage['status'] }> = ({ status }) => {
    switch (status) {
        case 'sending': return <ClockIcon className="w-4 h-4 text-slate-400" />;
        case 'delivered': return <DeliveredIcon className="w-4 h-4 text-slate-400" />;
        case 'read': return <DeliveredIcon className="w-4 h-4 text-blue-500" />;
        case 'failed': return <ErrorIcon className="w-4 h-4 text-red-500" />;
        default: return null;
    }
};
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
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [inputValue]);
    
    // Initialize Chat
    useEffect(() => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const plansToString = (plans: Plan[], type: string) => plans.map(p => `- ${p.duration} ${type}: ₹${p.price}`).join('\n');
            const allPlansInfo = `\n**कॉलिंग प्लान्स**\n${plansToString(CALL_PLANS, 'कॉल')}\n\n**चैट प्लान्स**\n${plansToString(CHAT_PLANS, 'चैट')}\n`;

            chatRef.current = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: `You are "सकून AI दोस्त", a warm, empathetic, and expert guide for the SakoonApp. Your personality is like a caring, knowledgeable friend. Your primary goal is to make the user feel comfortable, understand how the app works, and guide them to connect with a human Listener. You are a guide, not a replacement for a Listener. Converse primarily in Hinglish (Hindi using the Roman script) or Hindi (Devanagari script), matching the user's language. Be natural and friendly. Keep it concise.

**Your Conversational Flow & Knowledge Base:**
1.  **Warm Welcome & Empathy:** Always start by gently greeting the user and asking what's on their mind. Example: "नमस्ते, मैं आपका सकून दोस्त हूँ। कैसे हैं आप? आप चाहें तो मुझसे अपने मन की बात कह सकते हैं।"
2.  **Introduce SakoonApp's Purpose:** "कभी-कभी किसी से बात कर लेने से ही मन बहुत हल्का हो जाता है। SakoonApp इसीलिए बना है ताकि आप जब चाहें, किसी से अपने मन की बात कह सकें।"
3.  **Act as an Expert App Guide:** You know every feature: "Home" Tab (buy DT plans & tokens), "Calls" & "Chats" Tabs (see available Listeners), "Profile" Tab (view profile, install app, read policies).
4.  **Understand Plans & Tokens:** DT (Direct Time) plans are always used first. Tokens are used only when you don't have an active DT plan. Costs: Calls cost 2 tokens/minute. Chats cost 1 token per 2 messages. All available plans are:${allPlansInfo}
5.  **Guide and Encourage:** Gently guide them towards using the app's main features. Example: "जब भी आप तैयार हों, आप 'Calls' या 'Chats' टैब पर जाकर किसी Listener से बात कर सकते हैं।"
6.  **NEVER Role-play as a Listener:** If a user shares deep personal issues, gently guide them. Example: "यह सुनने में बहुत कठिन लग रहा है। हमारे एक Listener से इस बारे में बात करना शायद आपके लिए मददगार हो सकता है। क्या आप चाहेंगे कि मैं आपको 'Services' पेज पर ले चलूँ?" Use the 'navigateToServices' function for this.`,
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
        const userMessageId = `user-${Date.now()}`;
        setInputValue('');
        
        const userMessage: ChatMessage = { id: userMessageId, text, sender: { uid: user.uid, name: user.name || 'You' }, timestamp: Date.now(), status: 'delivered' };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        setError(null);

        try {
            const result = await chatRef.current.sendMessage({ message: text });
            
            const functionCalls = result.candidates?.[0]?.content?.parts.filter(part => !!part.functionCall);
            if (functionCalls && functionCalls.length > 0 && functionCalls[0].functionCall?.name === 'navigateToServices') {
                onNavigateToServices();
            }
            
            const aiMessage: ChatMessage = { id: `ai-${Date.now()}`, text: result.text, sender: { uid: 'ai', name: 'सकून दोस्त' }, timestamp: Date.now() };

            setMessages(prev => [
                ...prev.map(msg => msg.id === userMessageId ? { ...msg, status: 'read' } as ChatMessage : msg),
                aiMessage
            ]);

        } catch (err: any) {
            console.error("Gemini API error:", err);
            setError("Sorry, I'm having trouble connecting right now. Please try again in a moment.");
            setMessages(prev => prev.map(msg => 
                msg.id === userMessageId ? { ...msg, status: 'failed' } as ChatMessage : msg
            ));
        } finally {
            setIsLoading(false);
            textareaRef.current?.focus();
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
            <div
                className="w-full max-w-lg h-full sm:h-[95%] sm:max-h-[700px] bg-stone-100 dark:bg-slate-950 rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col overflow-hidden animate-fade-in-up"
                onClick={e => e.stopPropagation()}
            >
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
                    <button 
                        onClick={onClose} 
                        className="text-sm border border-red-500 text-red-500 font-semibold px-4 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                        End chat
                    </button>
                </header>
        
                <main className="flex-grow p-4 overflow-y-auto" style={{backgroundImage: `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')`}}>
                    <div className="flex flex-col gap-2">
                        {messages.map((msg) => {
                            const isAI = msg.sender.uid === 'ai';
                            const isUser = msg.sender.uid === user.uid;
                            return (
                                <div key={msg.id} className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
                                    {isAI && (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-teal-400 flex items-center justify-center shrink-0 self-start">
                                            <RobotIcon className="w-5 h-5 text-white" />
                                        </div>
                                    )}
                                    <div className={`max-w-xs md:max-w-md p-2.5 rounded-xl flex flex-col ${isAI ? 'bg-white dark:bg-slate-800 rounded-bl-none shadow-sm' : 'bg-[#dcf8c6] dark:bg-cyan-900 text-slate-800 dark:text-slate-100 rounded-tr-none'}`}>
                                        <div className="text-sm prose prose-sm dark:prose-invert max-w-none"><MarkdownRenderer text={msg.text} /></div>
                                        <div className="flex items-center self-end gap-1.5 mt-1 text-slate-500 dark:text-slate-400">
                                            <span className="text-xs">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            {isUser && <MessageStatus status={msg.status} />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {isLoading && (
                            <div className="flex items-end gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-teal-400 flex items-center justify-center shrink-0"><RobotIcon className="w-5 h-5 text-white" /></div>
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
                
                <footer className="p-2 bg-transparent flex-shrink-0">
                    <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                        <div className="flex-grow min-w-0 bg-white dark:bg-slate-900 rounded-2xl flex items-end px-3 py-1 shadow-sm">
                            <textarea
                                ref={textareaRef}
                                rows={1}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="सकून दोस्त से पूछें..."
                                className="flex-grow bg-transparent p-2 focus:outline-none text-slate-900 dark:text-white resize-none max-h-28 overflow-y-auto"
                                disabled={isLoading}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
                            />
                        </div>
                        <button type="submit" disabled={isLoading || !inputValue.trim()} className="w-12 h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center transition-all transform hover:scale-110 shadow-md disabled:bg-slate-500 disabled:cursor-not-allowed disabled:scale-100 shrink-0" aria-label="Send message">
                            <div className="relative w-6 h-6">
                                <MicrophoneIcon className={`absolute inset-0 w-full h-full transition-all duration-300 ${inputValue.trim() ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`} />
                                <SendIcon className={`absolute inset-0 w-full h-full transition-all duration-300 ${inputValue.trim() ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
                            </div>
                        </button>
                    </form>
                </footer>
            </div>
        </div>
    );
};

export default AICompanion;

import React, { useEffect, useRef, useState, useCallback, Fragment } from 'react';
import type { ChatSession, User, ChatMessage } from '../types';
import { fetchZegoToken } from '../utils/zego.ts';
import { functions } from '../utils/firebase.ts';

declare global {
  interface Window {
    ZegoUIKitPrebuilt: any;
  }
}

interface ChatUIProps {
  session: ChatSession;
  user: User;
  onLeave: (success: boolean, consumedMessages: number) => void;
}

// --- SVG Icons ---
const VerifiedIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
);
const SendIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);
const MicrophoneIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
        <path d="M6 10.5a.75.75 0 01.75.75v.5a5.25 5.25 0 0010.5 0v-.5a.75.75 0 011.5 0v.5a6.75 6.75 0 01-13.5 0v-.5a.75.75 0 01.75-.75z" />
    </svg>
);
const ClockIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" /></svg>;
const SentIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" /></svg>;
const DeliveredIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.953 4.136a.75.75 0 01.143 1.052l-5 6.5a.75.75 0 01-1.127.075l-2.5-2.5a.75.75 0 111.06-1.06l1.894 1.893 4.48-5.824a.75.75 0 011.052-.143z" clipRule="evenodd" /><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" /></svg>;
const ErrorIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>;

type ConnectionStatus = 'connecting' | 'waiting' | 'connected' | 'error' | 'ended';

const MessageStatus: React.FC<{ status?: ChatMessage['status'] }> = ({ status }) => {
    switch (status) {
        case 'sending': return <ClockIcon className="w-4 h-4 text-slate-400" />;
        case 'sent': return <SentIcon className="w-4 h-4" />;
        case 'delivered': return <DeliveredIcon className="w-4 h-4" />;
        case 'read': return <DeliveredIcon className="w-4 h-4 text-blue-500" />;
        case 'failed': return <ErrorIcon className="w-4 h-4 text-red-500" />;
        default: return null;
    }
};

const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

const formatDateSeparator = (date: Date) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (isSameDay(date, today)) return 'Today';
    if (isSameDay(date, yesterday)) return 'Yesterday';
    return date.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
};

const ChatUI: React.FC<ChatUIProps> = ({ session, user, onLeave }) => {
  const zpInstanceRef = useRef<any>(null);
  const hasLeftRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const associatedPlanIdRef = useRef(session.associatedPlanId);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [isListenerTyping, setIsListenerTyping] = useState(false);
  const [imageError, setImageError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sentMessagesCount, setSentMessagesCount] = useState(0);

  const addSystemMessage = useCallback((text: string) => {
      setMessages(prev => [...prev, {
          id: `system-${Date.now()}`,
          text,
          sender: { uid: 'system', name: 'System'},
          timestamp: Date.now()
      }]);
  }, []);

  const handleLeave = useCallback((isSuccess: boolean) => {
    if (hasLeftRef.current) return;
    hasLeftRef.current = true;
    setStatus('ended');
    onLeave(isSuccess, sentMessagesCount);
  }, [onLeave, sentMessagesCount]);

  useEffect(() => {
    window.history.pushState(null, '');
    const handleBackButton = () => handleLeave(true);
    window.addEventListener('popstate', handleBackButton);
    return () => window.removeEventListener('popstate', handleBackButton);
  }, [handleLeave]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
   
  useEffect(scrollToBottom, [messages]);
    
  useEffect(() => {
      if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
  }, [inputValue]);
  
  useEffect(() => {
    let zp: any;
    const initZego = async () => {
      setStatus('connecting');
      try {
        const kitToken = await fetchZegoToken(session.associatedPlanId);
        zp = window.ZegoUIKitPrebuilt.create(kitToken);
        zpInstanceRef.current = zp;

        if (session.isFreeTrial) {
            addSystemMessage(`This is a Free Trial session. You can send short messages (up to 75 characters) to the Listener.`);
        }

        zp.on('IMRecvCustomCommand', ({ fromUser, command }: { fromUser: { userID: string }, command: string }) => {
            if (fromUser.userID === String(session.listener.id)) {
                const cmdData = JSON.parse(command);
                if (cmdData.type === 'typing_status') {
                    setIsListenerTyping(cmdData.isTyping);
                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                    if (cmdData.isTyping) {
                        typingTimeoutRef.current = window.setTimeout(() => setIsListenerTyping(false), 3000);
                    }
                }
            }
        });

        await zp.joinRoom({
          container: document.createElement('div'),
          showMyCameraToggleButton: false, showAudioVideoSettingsButton: false, showScreenSharingButton: false, showMicrophoneToggleButton: false,
          showPreJoinView: false, turnOnCameraWhenJoining: false, turnOnMicrophoneWhenJoining: false, showCallTimer: false, showLeaveRoomConfirmDialog: false,
          onInRoomMessageReceived: (messageList: any[]) => {
              const newMessages: ChatMessage[] = messageList.map(msg => ({ id: msg.messageID, text: msg.message, sender: { uid: msg.fromUser.userID, name: msg.fromUser.userName }, timestamp: msg.sendTime, status: 'read' }));
              setMessages(prev => [...prev, ...newMessages]);
          },
          onUserJoin: (users: any[]) => {
             if (users.some(u => u.userID === String(session.listener.id))) {
                  setStatus('connected');
                  addSystemMessage(`${session.listener.name} has joined the chat.`);
             }
          },
          onUserLeave: (users: any[]) => {
              if (users.some(u => u.userID === String(session.listener.id))) {
                  addSystemMessage(`${session.listener.name} has left the chat.`);
                  setTimeout(() => handleLeave(true), 2000);
              }
          }
        });

        const remoteUsers = zp.getRemoteUsers();
        if (remoteUsers.some((u: any) => u.userID === String(session.listener.id))) {
             setStatus('connected');
             addSystemMessage(`${session.listener.name} is already in the chat.`);
        } else {
            setStatus('waiting');
            addSystemMessage(`Chat started with ${session.listener.name}. Waiting for them to join...`);
        }

      } catch (error) {
        console.error("Zego initialization failed", error);
        setStatus('error');
        addSystemMessage('A connection error occurred. Please try again.');
        setTimeout(() => handleLeave(false), 3000);
      }
    };
    initZego();
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (zpInstanceRef.current) { zpInstanceRef.current.destroy(); }
    };
  }, [session.associatedPlanId, session.listener.id, session.listener.name, addSystemMessage, handleLeave, session.isFreeTrial]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !zpInstanceRef.current || status !== 'connected') return;

    const localMessageId = `local-${Date.now()}`;
    const textToSend = inputValue.trim();
    setInputValue('');
    setTimeout(() => textareaRef.current?.focus(), 0);

    const localMessage: ChatMessage = { id: localMessageId, text: textToSend, sender: { uid: user.uid, name: user.name }, timestamp: Date.now(), status: 'sending' };
    setMessages(prev => [...prev, localMessage]);
    
    if (session.isFreeTrial) {
        if (textToSend.length > 75) {
            addSystemMessage("Free trial messages must be 75 characters or less.");
            setMessages(prev => prev.filter(m => m.id !== localMessageId));
            setInputValue(textToSend);
            return;
        }
        try {
            await functions.httpsCallable("useFreeMessage")();
            await zpInstanceRef.current.sendRoomMessage(textToSend);
            setSentMessagesCount(prev => prev + 1);
            setMessages(prev => prev.map(m => m.id === localMessageId ? { ...m, status: 'sent' } : m));
            setTimeout(() => setMessages(prev => prev.map(m => m.id === localMessageId ? { ...m, status: 'read' } : m)), 2000);
        } catch (error: any) {
            console.error('Failed to use free message:', error);
            setMessages(prev => prev.map(m => m.id === localMessageId ? { ...m, status: 'failed' } : m));
            addSystemMessage(error.message || 'Failed to send free message.');
            if (error.code === 'functions/failed-precondition') setTimeout(() => handleLeave(true), 3000);
        }
        return;
    }

    try {
        const result: any = await functions.httpsCallable("deductUsage")({ type: 'chat', messages: 1, associatedPlanId: associatedPlanIdRef.current });
        if (result.data.planId?.startsWith('mt_session')) associatedPlanIdRef.current = result.data.planId;
        await zpInstanceRef.current.sendRoomMessage(textToSend);
        setSentMessagesCount(prev => prev + 1);
        setMessages(prev => prev.map(m => m.id === localMessageId ? {...m, status: 'sent'} : m));
        setTimeout(() => setMessages(prev => prev.map(m => m.id === localMessageId ? {...m, status: 'read'} : m)), 2000);
    } catch (error: any) {
        console.error('Failed to send message:', error);
        setMessages(prev => prev.map(m => m.id === localMessageId ? {...m, status: 'failed'} : m));
        addSystemMessage(error.message || 'Failed to send message. Please check your balance.');
        if(error.code === 'functions/failed-precondition') setTimeout(() => handleLeave(true), 3000);
    }
  };
  
  const listener = session.listener;

  const getStatusText = () => {
      if (isListenerTyping) return 'Listener is typing...';
      switch (status) {
          case 'connecting': return 'Connecting...';
          case 'waiting': return listener.online ? 'Waiting...' : 'Offline';
          case 'connected': return 'Online';
          case 'error': return 'Connection Error';
          case 'ended': return 'Chat Ended';
          default: return listener.online ? 'Online' : 'Offline';
      }
  };
  
  const getStatusColor = () => {
       if (isListenerTyping) return 'text-yellow-600 dark:text-yellow-400';
       switch (status) {
          case 'connected': return 'text-green-600 dark:text-green-400';
          case 'error': case 'ended': return 'text-red-600 dark:text-red-400';
          default: return 'text-slate-500 dark:text-slate-400';
      }
  };

  return (
    <div className="fixed inset-0 bg-stone-100 dark:bg-slate-900 flex flex-col h-full" style={{backgroundImage: `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')`}}>
      <header className="bg-white dark:bg-slate-900 shadow-md z-10 flex items-center p-3 gap-3 flex-shrink-0">
        <img src={listener.image} alt={listener.name} className="w-10 h-10 rounded-full object-cover" onError={() => setImageError(true)} />
        <div className="flex-grow">
            <div className="flex items-center gap-1.5"><h1 className="font-bold text-slate-800 dark:text-slate-100">{listener.name}</h1><VerifiedIcon className="w-5 h-5 text-blue-500" /></div>
            <p className={`text-xs font-semibold ${getStatusColor()}`}>{getStatusText()}</p>
        </div>
        <button onClick={() => handleLeave(true)} className="text-sm bg-red-100 text-red-700 font-semibold px-3 py-1.5 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900" aria-label="End Chat" disabled={status === 'ended'}>End Chat</button>
      </header>

      <main className="flex-grow overflow-y-auto p-4 bg-transparent">
        <div className="flex flex-col gap-1">
          {messages.map((msg, index) => {
            const prevMsg = messages[index - 1];
            const showDateSeparator = !prevMsg || !isSameDay(new Date(msg.timestamp), new Date(prevMsg.timestamp));
            return (
              <Fragment key={msg.id}>
                {showDateSeparator && <div className="text-center my-3"><span className="bg-slate-200/80 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full dark:bg-slate-800/80 dark:text-slate-300 backdrop-blur-sm">{formatDateSeparator(new Date(msg.timestamp))}</span></div>}
                {msg.sender.uid === 'system' ? (
                    <div className="text-center my-2"><span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1.5 rounded-full dark:bg-blue-900 dark:text-blue-300">{msg.text}</span></div>
                ) : (
                  <div className={`flex ${msg.sender.uid === user.uid ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs md:max-w-md p-2.5 rounded-xl flex flex-col ${msg.sender.uid === user.uid ? 'bg-[#dcf8c6] dark:bg-cyan-900 text-slate-800 dark:text-slate-100 rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none shadow-sm'}`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      <div className="flex items-center self-end gap-1.5 mt-1 text-slate-500 dark:text-slate-400">
                          <span className="text-xs">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {msg.sender.uid === user.uid && <MessageStatus status={msg.status} />}
                      </div>
                    </div>
                  </div>
                )}
              </Fragment>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </main>

       <footer className="bg-transparent p-2 flex-shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
              <div className="flex-grow bg-white dark:bg-slate-900 rounded-2xl flex items-end px-3 py-1 shadow-sm min-w-0">
                  <textarea ref={textareaRef} rows={1} value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder={status === 'connected' ? "Type a message..." : "Waiting to connect..."} className="flex-grow bg-transparent p-2 focus:outline-none text-slate-900 dark:text-white resize-none max-h-28 overflow-y-auto" disabled={status !== 'connected'} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }}}/>
              </div>
              <button type="submit" className="w-12 h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center transition-all transform hover:scale-110 shadow-md disabled:bg-slate-500 disabled:cursor-not-allowed disabled:scale-100 shrink-0" disabled={status !== 'connected' || !inputValue.trim()} aria-label="Send Message">
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

export default React.memo(ChatUI);
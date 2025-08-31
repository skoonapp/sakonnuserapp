import type { Plan, FaqItem } from './types';

// Other application constants
export const AVATAR_EMOJIS = ['👨', '👩', '🎭', '🎪', '🎨', '🎵'];
export const QUICK_REPLIES = [
    "Hello, how can I help you today?",
    "I understand. Please give me a moment to look into this.",
    "Thank you for sharing. I'm here for you.",
    "Is there anything else I can help you with?",
];


// Dummy data has been removed as the app now connects to Firestore for live data.
// The initial state for calls, chats, and history is now handled as an empty array in App.tsx.

import { RecentActivity, CallHistoryItem, ChatHistoryItem as ChatHistoryType } from './types';

// These can be kept if you want some placeholder history on first load,
// but for a real app, this would also come from Firestore.
export const INITIAL_RECENT_ACTIVITIES: RecentActivity[] = [];

export const INITIAL_CALL_HISTORY: CallHistoryItem[] = [];

export const INITIAL_CHAT_HISTORY: ChatHistoryType[] = [];

export const INITIAL_ACTIVE_CHATS = []; // Placeholder, will be managed by state

// FIX: Added missing constants required by multiple components.

export const RAZORPAY_KEY_ID = "rzp_test_1DP0deJj2SjY8d"; // Replace with your actual Razorpay Test Key ID

export const CALL_PLANS: Plan[] = [
    { duration: '5 मिनट', price: 50, tierName: 'Bronze Pack' },
    { duration: '10 मिनट', price: 100, tierName: 'Silver Pack' },
    { duration: '15 मिनट', price: 145, tierName: 'Gold Pack' },
    { duration: '30 मिनट', price: 270, tierName: 'Platinum Pack' },
    { duration: '45 मिनट', price: 410, tierName: 'Diamond Pack' },
    { duration: '60 मिनट', price: 540, tierName: 'Elite Pack' },
];

export const CHAT_PLANS: Plan[] = [
    { duration: '5 मिनट', price: 20 },
    { duration: '10 मिनट', price: 36 },
    { duration: '15 मिनट', price: 50 },
    { duration: '30 मिनट', price: 90 },
    { duration: '45 मिनट', price: 135 },
    { duration: '60 मिनट', price: 170 },
];

export const FAQ_DATA: FaqItem[] = [
    {
        question: 'SakoonApp क्या है?',
        answer: 'SakoonApp एक ऐसा प्लेटफॉर्म है जहां आप अपनी भावनाओं को साझा करने और भावनात्मक समर्थन पाने के लिए प्रशिक्षित Listeners से जुड़ सकते हैं।',
        isPositive: true,
    },
    {
        question: 'क्या मेरी बातचीत गोपनीय रहती है?',
        answer: 'हाँ, आपकी सभी बातचीत पूरी तरह से गोपनीय और सुरक्षित हैं। हम आपकी गोपनीयता को गंभीरता से लेते हैं।',
        isPositive: true,
    },
    {
        question: 'क्या Listeners पेशेवर चिकित्सक हैं?',
        answer: 'नहीं, हमारे Listeners पेशेवर चिकित्सक या काउंसलर नहीं हैं। वे सहानुभूतिपूर्ण व्यक्ति हैं जिन्हें सक्रिय रूप से सुनने के लिए प्रशिक्षित किया गया है। वे चिकित्सा सलाह नहीं देते हैं।',
        isPositive: false,
    },
    {
        question: 'मैं एक प्लान कैसे खरीदूं?',
        answer: 'आप "होम" टैब पर जाकर कॉलिंग/चैट प्लान या टोकन पैक खरीद सकते हैं। भुगतान सुरक्षित रूप से Razorpay के माध्यम से किया जाता है।',
        isPositive: true,
    },
    {
        question: 'टोकन और DT प्लान में क्या अंतर है?',
        answer: 'DT (डायरेक्ट टाइम) प्लान लंबी, निर्बाध बातचीत के लिए हैं। टोकन छोटी, कई बातचीत के लिए लचीलापन प्रदान करते हैं। आप अपनी सुविधानुसार चुन सकते हैं।',
        isPositive: true,
    },
];

export const TESTIMONIALS_DATA = [
    {
        name: 'प्रिया S.',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=128&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        quote: 'जब मैं अकेला महसूस कर रही थी, तब SakoonApp ने मुझे एक दोस्त दिया जिससे मैं बात कर सकती थी। इसने वास्तव में मेरी मदद की।',
    },
    {
        name: 'अमित K.',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=128&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        quote: 'बिना किसी जजमेंट के किसी से बात करना बहुत ताज़गी भरा था। Listener बहुत समझदार और सहायक थे।',
    },
    {
        name: 'सुनीता M.',
        image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=128&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        quote: 'यह ऐप उन लोगों के लिए एक बेहतरीन पहल है जो सिर्फ अपने मन की बात कहना चाहते हैं। मैं इसकी बहुत सराहना करती हूँ।',
    },
];
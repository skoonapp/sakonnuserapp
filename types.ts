
export type ActiveView = 'home' | 'calls' | 'chats' | 'profile';

export interface User {
  uid: string;
  name: string;
  email: string | null;
  mobile?: string;
  role?: 'admin' | 'listener';
  listenerId?: string;
  favoriteListeners?: number[];
  tokenBalance?: number;
}

export interface Listener {
  id: number;
  name: string;
  image: string;
  online: boolean;
  rating: number;
  reviewsCount: number;
  gender: 'Male' | 'Female';
  age: number;
}

export interface Plan {
  duration: string;
  price: number;
  tierName?: string;
}

export interface PurchasedPlan {
  id: string;
  type: 'call' | 'chat';
  plan: Plan;
  purchaseTimestamp: number;
  expiryTimestamp: number;
  remainingSeconds?: number;
  totalSeconds?: number;
  remainingMessages?: number;
  totalMessages?: number;
  isTokenSession?: boolean;
  isFreeTrial?: boolean;
}

export interface ChatMessageSender {
    uid: string;
    name: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: ChatMessageSender;
  timestamp: number;
}

export interface BaseSession {
    listener: Listener;
    plan: Plan;
    sessionDurationSeconds: number;
    associatedPlanId: string;
    isTokenSession: boolean;
}

export interface CallSession extends BaseSession {
    type: 'call';
}

export interface ChatSession extends BaseSession {
    type: 'chat';
    isFreeTrial?: boolean;
}

export interface FaqItem {
    question: string;
    answer: string;
    isPositive: boolean;
}


// --- Admin Panel Types (Kept for reference, but unused by new App.tsx) ---

export type Screen = 'login' | 'dashboard' | 'call' | 'chat' | 'settings' | 'listeners' | 'callHistory' | 'leaderboard' | 'rules' | 'blocked' | 'support' | 'tickets' | 'regulations';

export type ActivityStatus = 'Active' | 'Waiting' | 'Completed';

export interface RecentActivity {
    id: string;
    avatar: string;
    name: string;
    plan: string;
    status: ActivityStatus;
    timestamp: string;
}

export interface AdminStats {
  activeCalls: number;
  activeChats: number;
  waitingQueue: number;
  todaysEarnings: number;
}

// Call Management types
export interface ActiveCall {
    id: string;
    name:string;
    planDuration: number; // in seconds
    endTime: number; // timestamp
    avatar: string;
}

export interface WaitingCall {
    id: string;
    name: string;
    plan: string;
    startTime: number; // timestamp
    avatar: string;
    isNew: boolean;
}

export interface CallHistoryItem {
    id: string;
    name: string;
    plan: string;
    duration: string;
    avatar: string;
}

export interface ActiveChat {
    id: string;
    name: string;
    planDuration: number; // in seconds
    endTime: number; // timestamp
    avatar: string;
    messages: {
        id: number;
        sender: 'user' | 'admin';
        text: string;
        timestamp: string;
    }[];
}

export interface WaitingChat {
    id: string;
    name: string;
    plan: string;
    startTime: number; // timestamp
    avatar: string;
    isNew: boolean;
}

export interface ChatHistoryItem {
    id: string;
    name: string;
    plan: string;
    duration: string;
    avatar: string;
}

export interface Earning {
    id: string;
    userName: string;
    type: 'Call' | 'Chat';
    duration: string;
    amount: number;
    timestamp: string;
}

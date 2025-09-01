

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
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
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
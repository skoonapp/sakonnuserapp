import { functions } from './firebase';

const addEarningCallable = functions.httpsCallable("addEarning");

// Call खत्म होने पर
export async function handleCallEnd(listener_id: string, user_id: string, duration_minutes: number) {
  try {
    await addEarningCallable({ listener_id, user_id, type: "call", duration_minutes });
  } catch (error) {
    console.error("Error adding call earning:", error);
  }
}

// Chat खत्म होने पर
export async function handleChat(listener_id: string, user_id: string, messages: number) {
  try {
    await addEarningCallable({ listener_id, user_id, type: "chat", messages });
  } catch (error) {
    console.error("Error adding chat earning:", error);
  }
}

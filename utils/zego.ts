import { functions } from './firebase';

// ZegoUIKitPrebuilt is loaded from a script tag in index.html
declare global {
  interface Window {
    ZegoUIKitPrebuilt: any;
  }
}

/**
 * Fetches a ZegoCloud Kit Token from our secure Firebase Callable Function.
 * The function verifies the user's authentication before issuing a token.
 * @param planId The ID of the session, used as the channel ID for Zego.
 * @returns A promise that resolves to the Zego Kit Token.
 */
export const fetchZegoToken = async (planId: string): Promise<string> => {
    try {
        const generateToken = functions.httpsCallable('generateZegoToken');
        const result = await generateToken({ planId });
        const token = (result.data as { token: string }).token;
        
        if (!token) {
            console.error('Invalid token response from server:', result.data);
            throw new Error('Invalid token response from server.');
        }

        return token;

    } catch (error) {
        console.error("Failed to fetch Zego token from callable function:", error);
        throw new Error("Could not create a secure session. Please try again.");
    }
};

import { auth } from './firebase';

// ZegoUIKitPrebuilt is loaded from a script tag in index.html
declare global {
  interface Window {
    ZegoUIKitPrebuilt: any;
  }
}

/**
 * Fetches a ZegoCloud Kit Token from our secure Firebase Function.
 * The function verifies the user's authentication and active plan before issuing a token.
 * @param planId The ID of the purchased plan document in Firestore.
 * @returns A promise that resolves to the Zego Kit Token.
 */
export const fetchZegoToken = async (planId: string): Promise<string> => {
    // यह URL Zego टोकन जेनरेट करने के लिए आपके डिप्लॉय किए गए फायरबेस फंक्शन एंडपॉइंट को इंगित करता है।
    const functionUrl = 'https://asia-south1-sakoonapp-9574c.cloudfunctions.net/api/generateZegoToken';

    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error("User not logged in.");
        }

        const idToken = await user.getIdToken(true);

        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({ planId: planId }),
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error(`Failed to fetch token. Server responded with ${response.status}:`, errorData.error);
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data || !data.token) {
            console.error('Invalid token response from server:', data);
            throw new Error('Invalid token response from server.');
        }

        return data.token;

    } catch (error) {
        console.error("Failed to fetch Zego token from Firebase Function:", error);
        throw new Error("Could not create a secure session. Please try again.");
    }
};

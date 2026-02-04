import { useState, useEffect } from "react";
import { messaging } from "@/lib/firebase"; // Using your existing firebase init
import { getToken, onMessage } from "firebase/messaging";
import { toast } from "sonner"; // Using 'sonner' as seen in App.tsx

export const usePushNotification = () => {
    const [fcmToken, setFcmToken] = useState<string | null>(null);

    useEffect(() => {
        const requestPermissionAndGetToken = async () => {
            try {
                const permission = await Notification.requestPermission();
                if (permission === "granted") {
                    // Get the token
                    // VAPID Key is optional usually if not configured in the call, but recommended if you have one. 
                    // If you don't have one generated in Firebase Console -> Cloud Messaging -> Web Config, 
                    // we can try without it, or you can add it here.
                    // For now, let's try basic getToken.
                    if (!messaging) {
                        console.warn("Messaging not supported in this window");
                        return;
                    }

                    const currentToken = await getToken(messaging);

                    if (currentToken) {
                        console.log("FCM Token:", currentToken);
                        setFcmToken(currentToken);
                        // TODO: Send this token to your server (Supabase) to associate with the user
                        // e.g. await saveTokenToSupabase(user.id, currentToken);
                    } else {
                        console.log("No registration token available. Request permission to generate one.");
                    }
                } else {
                    console.log("Notification permission not granted.");
                }
            } catch (err) {
                console.log("An error occurred while retrieving token. ", err);
            }
        };

        requestPermissionAndGetToken();
    }, []);

    // Listen for foreground messages
    useEffect(() => {
        if (!messaging) return;

        const unsubscribe = onMessage(messaging, (payload) => {
            console.log("Message received. ", payload);
            // Show a toast or notification when app is in foreground
            toast(payload.notification?.title || "New Notification", {
                description: payload.notification?.body,
            });
        });

        return () => unsubscribe();
    }, []);

    return { fcmToken };
};

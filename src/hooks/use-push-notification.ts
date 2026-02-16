// src/hooks/use-push-notification.ts
import { useState, useEffect } from "react";
import { messaging } from "@/lib/firebase";
import { getToken, onMessage } from "firebase/messaging";
import { toast } from "sonner";
import { localNotificationService } from "@/services/local-notification-service";
import { getApiUrl } from "@/lib/config";

const API_URL = getApiUrl();
// Default user ID from config (or similar)
const DEFAULT_USER_ID = "6221431c-7a17-4acc-9c01-43903e30eb21";

export const usePushNotification = () => {
    const [fcmToken, setFcmToken] = useState<string | null>(null);

    useEffect(() => {
        const requestPermissionAndGetToken = async () => {
            try {
                const permission = await localNotificationService.requestPermission();

                if (permission === "granted" && messaging) {
                    try {
                        // Use default config (no VAPID key needed if configured in project settings)
                        const currentToken = await getToken(messaging);

                        if (currentToken) {
                            setFcmToken(currentToken);
                            console.log("[FCM] Token obtained:", currentToken);

                            // Send token to backend
                            try {
                                await fetch(`${API_URL}/save-token`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        token: currentToken,
                                        user_id: DEFAULT_USER_ID
                                    })
                                });
                                console.log("[FCM] Token sent to backend.");
                            } catch (e) {
                                console.error("[FCM] Error saving token to backend:", e);
                            }
                        } else {
                            console.log("[FCM] No registration token available.");
                        }
                    } catch (e) {
                        console.error("[FCM] Error retrieving token:", e);
                    }
                }
            } catch (err) {
                console.error("[FCM] Error in permission request:", err);
            }
        };

        requestPermissionAndGetToken();
    }, []);

    // Foreground listener
    useEffect(() => {
        if (!messaging) return;

        const unsubscribe = onMessage(messaging, (payload) => {
            console.log("[FCM] Message received:", payload);

            const title = payload.notification?.title || "Biyuyo Notificación";
            const body = payload.notification?.body || "";

            // Display Toast
            toast.info(title, {
                description: body,
            });

            // Display Local Notification
            localNotificationService.displayNotification(title, {
                body: body,
                requireInteraction: false
            });
        });

        return () => unsubscribe();
    }, []);

    return { fcmToken };
};

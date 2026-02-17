import { getMLApiUrl } from "./config";

/**
 * Triggers a background training request to the ML API.
 * This is designed to be called silently after a transaction is registered.
 */
export const triggerMLTraining = async (userId: string) => {
    if (!userId) return;

    try {
        const mlUrl = getMLApiUrl();
        console.log(`[ML] Triggering automated training for user: ${userId}`);

        // We don't await this to avoid blocking the UI
        fetch(`${mlUrl}/train/${userId}`, {
            method: "POST",
        }).catch(err => {
            console.error("[ML] background training trigger failed:", err);
        });

    } catch (error) {
        console.error("[ML] Error setting up background training trigger:", error);
    }
};

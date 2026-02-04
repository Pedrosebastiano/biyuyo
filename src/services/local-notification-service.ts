/**
 * Service to handle Local Notifications in the browser.
 * Mimics basic "Notifee" behavior for the web.
 */

interface LocalNotificationOptions {
    body?: string;
    icon?: string;
    tag?: string;
    data?: any;
}

class LocalNotificationService {
    private static instance: LocalNotificationService;
    private scheduledNotifications: Map<string, NodeJS.Timeout> = new Map();

    private constructor() { }

    public static getInstance(): LocalNotificationService {
        if (!LocalNotificationService.instance) {
            LocalNotificationService.instance = new LocalNotificationService();
        }
        return LocalNotificationService.instance;
    }

    /**
     * Request permission to show notifications.
     */
    public async requestPermission(): Promise<NotificationPermission> {
        if (!("Notification" in window)) {
            console.warn("This browser does not support desktop notifications");
            return "denied";
        }
        return await Notification.requestPermission();
    }

    /**
     * Display a notification immediately.
     */
    public displayNotification(title: string, options?: LocalNotificationOptions) {
        // CHECK: If we are Online, we assume FCM will handle the notification.
        // Prevent duplicate (FCM + Local) by suppressing local if online.
        if (navigator.onLine) {
            console.log("App is online. Suppressing local notification in favor of FCM.");
            return;
        }

        if (Notification.permission === "granted") {
            new Notification(title, {
                icon: "/favicon.ico",
                ...options,
            });
        } else {
            console.warn("Notification permission not granted.");
        }
    }

    /**
     * Schedule a notification for a specific date.
     * NOTE: This only works if the app is OPEN (foreground or background tab).
     * It uses setTimeout, which relies on the JS event loop.
     */
    public scheduleNotification(
        id: string,
        title: string,
        date: Date,
        options?: LocalNotificationOptions
    ): void {
        const now = new Date().getTime();
        const targetTime = date.getTime();
        const delay = targetTime - now;

        // If existing schedule exists for this ID, cancel it
        if (this.scheduledNotifications.has(id)) {
            clearTimeout(this.scheduledNotifications.get(id));
            this.scheduledNotifications.delete(id);
        }

        if (delay <= 0) {
            // If time has passed slightly, show it immediately (optional logic)
            // or ignore if it's too old. 
            // For now, let's ignore very old ones but show ones that just passed.
            if (delay > -60000) { // If within last minute
                this.displayNotification(title, options);
            }
            return;
        }

        const timeoutId = setTimeout(() => {
            this.displayNotification(title, options);
            this.scheduledNotifications.delete(id); // Cleanup
        }, delay);

        this.scheduledNotifications.set(id, timeoutId);
        console.log(`Scheduled notification "${title}" for ${date.toLocaleString()}`);
    }

    /**
     * Cancel a scheduled notification.
     */
    public cancelNotification(id: string): void {
        if (this.scheduledNotifications.has(id)) {
            clearTimeout(this.scheduledNotifications.get(id));
            this.scheduledNotifications.delete(id);
            console.log(`Cancelled notification ${id}`);
        }
    }
}

export const localNotificationService = LocalNotificationService.getInstance();

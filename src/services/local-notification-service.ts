// src/services/local-notification-service.ts

interface LocalNotificationOptions {
    body?: string;
    icon?: string;
    tag?: string;
    data?: Record<string, unknown>;
    requireInteraction?: boolean;
}

class LocalNotificationService {
    private static instance: LocalNotificationService;
    // Using any for the timeout ID to be compatible with NodeJS.Timeout and number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private scheduledNotifications: Map<string, any> = new Map();

    private constructor() { }

    public static getInstance(): LocalNotificationService {
        if (!LocalNotificationService.instance) {
            LocalNotificationService.instance = new LocalNotificationService();
        }
        return LocalNotificationService.instance;
    }

    public async requestPermission(): Promise<NotificationPermission> {
        if (!("Notification" in window)) {
            console.warn("Este navegador no soporta notificaciones.");
            return "denied";
        }
        return await Notification.requestPermission();
    }

    public async displayNotification(title: string, options?: LocalNotificationOptions) {
        if (Notification.permission !== "granted") return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const notificationOptions: NotificationOptions & { vibrate?: number[] } = {
            icon: "/logo192.png", // Ensure this exists or use a default
            badge: "/favicon.ico",
            vibrate: [200, 100, 200],
            ...options,
        };

        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (registration as any).showNotification(title, notificationOptions);
            } catch (e) {
                console.error("Error showing notification via ServiceWorker:", e);
                new Notification(title, notificationOptions);
            }
        } else {
            new Notification(title, notificationOptions);
        }
    }

    public scheduleNotification(id: string, title: string, date: Date, options?: LocalNotificationOptions): void {
        const delay = date.getTime() - Date.now();

        if (this.scheduledNotifications.has(id)) {
            clearTimeout(this.scheduledNotifications.get(id));
        }

        if (delay <= 0) {
            // If the date is in the past (but recently, e.g. within 1 min), show it.
            if (delay > -60000) this.displayNotification(title, options);
            return;
        }

        // setTimeout limit is 24.8 days
        if (delay > 2147483647) return; 

        const timeoutId = setTimeout(() => {
            this.displayNotification(title, options);
            this.scheduledNotifications.delete(id);
        }, delay);

        this.scheduledNotifications.set(id, timeoutId);
    }

    public cancelNotification(id: string): void {
        const timeout = this.scheduledNotifications.get(id);
        if (timeout) {
            clearTimeout(timeout);
            this.scheduledNotifications.delete(id);
        }
    }
}

export const localNotificationService = LocalNotificationService.getInstance();

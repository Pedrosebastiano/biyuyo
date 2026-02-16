import { useEffect, useRef } from "react";
import { useTransactions, Reminder } from "@/hooks/useTransactions";
import { localNotificationService } from "@/services/local-notification-service";

/**
 * This component has NO UI.
 * It strictly logic to watch 'reminders' and schedule local notifications.
 */
export const ReminderNotificationManager = () => {
    const { reminders } = useTransactions();
    // Keep track of reminders we've already scheduled to avoid duplicates/spam
    const scheduledReminderIds = useRef<Set<string>>(new Set());

    useEffect(() => {
        // Request permission on mount
        localNotificationService.requestPermission();
    }, []);

    useEffect(() => {
        if (!reminders || reminders.length === 0) return;

        reminders.forEach((reminder: Reminder) => {
            // Validation: Ensure valid date
            const dueDate = new Date(reminder.nextDueDate);
            if (isNaN(dueDate.getTime())) return;

            // Simple check: user ID + Next Due Date string to strictly identify this occurrence
            const uniqueKey = `${reminder.id}-${dueDate.toISOString()}`;

            if (!scheduledReminderIds.current.has(uniqueKey)) {
                // Schedule it
                localNotificationService.scheduleNotification(
                    uniqueKey,
                    `Recordatorio de Pago: ${reminder.name}`,
                    dueDate,
                    {
                        body: `Monto: ${reminder.currency} ${reminder.amount}\nLugar: ${reminder.business}`,
                        tag: uniqueKey
                    }
                );

                // Mark as scheduled
                scheduledReminderIds.current.add(uniqueKey);
            }
        });

    }, [reminders]);

    return null; // Render nothing
};

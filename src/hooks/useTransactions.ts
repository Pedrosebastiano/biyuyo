import { useState, useEffect } from "react";

export interface Transaction {
  id: string;
  type: "expense" | "income";
  amount: number;
  currency: "USD" | "VES";
  macroCategory: string;
  category: string;
  business: string;
  date: string;
  receiptImage?: string;
}

export interface Reminder {
  id: string;
  name: string;
  amount: number;
  currency: "USD" | "VES";
  macroCategory: string;
  category: string;
  business: string;
  nextDueDate: Date;
  frequency: string;
  isInstallment: boolean;
  currentInstallment?: number;
  totalInstallments?: number;
}

const STORAGE_KEY_TRANSACTIONS = "transactions";
const STORAGE_KEY_REMINDERS = "reminders";

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
    return stored ? JSON.parse(stored) : [];
  });

  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_REMINDERS);
    if (stored) {
      const parsed = JSON.parse(stored);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return parsed.map((r: any) => ({
        ...r,
        nextDueDate: new Date(r.nextDueDate),
      }));
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(reminders));
  }, [reminders]);

  const addTransaction = (transaction: Omit<Transaction, "id" | "date">) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString().split("T")[0],
    };
    setTransactions((prev) => [newTransaction, ...prev]);
  };

  const addReminder = (reminder: Omit<Reminder, "id">) => {
    const newReminder: Reminder = {
      ...reminder,
      id: `rem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    setReminders((prev) => [newReminder, ...prev]);
  };

  return {
    transactions,
    reminders,
    addTransaction,
    addReminder,
  };
}
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";

import { getApiUrl } from "@/lib/config";

const API_URL = getApiUrl();


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
  userFeedback?: number | null;
  creatorName?: string;
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
  creatorName?: string;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  savings: number;
  createdAt: string;
}

export function useTransactions(userId: string, sharedId?: string | null) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // Función para obtener los datos de la NUBE (Render + Supabase) 
  const fetchTransactions = useCallback(async () => {
    if (!userId) {
      console.log('[useTransactions] No userId provided, skipping fetch');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Build query params based on active profile
      let queryParams: string;
      if (sharedId) {
        queryParams = `?sharedId=${sharedId}`;
      } else {
        queryParams = `?userId=${userId}`;
      }

      console.log(`[useTransactions] Fetching data from: ${API_URL}`);
      console.log(`[useTransactions] UserID: ${userId}, SharedID: ${sharedId || 'none (personal)'}`);

      // 1. Pedimos Gastos, Ingresos, Recordatorios y Cuentas al mismo tiempo
      const [resExpenses, resIncomes, resReminders, resAccounts] = await Promise.all([
        fetch(`${API_URL}/expenses${queryParams}`),
        fetch(`${API_URL}/incomes${queryParams}`),
        fetch(`${API_URL}/reminders${queryParams}`),
        fetch(`${API_URL}/accounts${queryParams}`)
      ]);

      console.log(`[useTransactions] Responses: Exp:${resExpenses.status}, Inc:${resIncomes.status}, Rem:${resReminders.status}, Acc:${resAccounts.status}`);


      const expensesData = await resExpenses.json();
      const incomesData = await resIncomes.json();
      const remindersData = await resReminders.json();
      const accountsData = await resAccounts.json();

      console.log(`[useTransactions] Data count: Exp:${expensesData.length}, Inc:${incomesData.length}, Rem:${remindersData.length}, Acc:${accountsData.length}`);


      // 2. Convertimos el formato de la Base de Datos al formato de tu App
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formattedExpenses: Transaction[] = expensesData
        .filter((item: any) => item.expense_id)
        .map((item: any) => ({
          id: `exp-${item.expense_id}`,
          type: "expense",
          amount: parseFloat(item.total_amount) || 0,
          currency: "USD",
          macroCategory: item.macrocategoria,
          category: item.categoria,
          business: item.negocio,
          date: item.created_at ? item.created_at.split('T')[0] : new Date().toISOString(),
          receiptImage: item.receipt_image_url || undefined,
          userFeedback: item.user_feedback ?? null,
          creatorName: sharedId ? item.creator_name : undefined,
        }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formattedIncomes: Transaction[] = incomesData
        .filter((item: any) => item.income_id)
        .map((item: any) => ({
          id: `inc-${item.income_id}`,
          type: "income",
          amount: parseFloat(item.total_amount) || 0,
          currency: "USD",
          macroCategory: item.macrocategoria,
          category: item.categoria,
          business: item.negocio,
          date: item.created_at ? item.created_at.split('T')[0] : new Date().toISOString(),
          creatorName: sharedId ? item.creator_name : undefined,
        }));

      // 3. Formateamos los recordatorios
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formattedReminders: Reminder[] = remindersData
        .filter((item: any) => item.id)
        .map((item: any) => ({
          id: item.id,
          name: item.nombre,
          amount: parseFloat(item.monto) || 0,
          currency: "USD" as const,
          macroCategory: item.macrocategoria,
          category: item.categoria,
          business: item.negocio,
          nextDueDate: new Date(item.fecha_proximo_pago),
          frequency: item.frecuencia,
          isInstallment: item.es_cuota || false,
          currentInstallment: 1,
          totalInstallments: item.cuota_actual || undefined,
          creatorName: sharedId ? item.creator_name : undefined,
        }));

      // 4. Formateamos las cuentas
      const formattedAccounts: Account[] = accountsData.map((item: any) => ({
        id: item.account_id,
        name: item.name,
        balance: parseFloat(item.balance) || 0,
        savings: parseFloat(item.savings) || 0,
        createdAt: item.created_at,
      }));

      // 5. Unimos transacciones y ordenamos por fecha (más reciente primero)
      const allTransactions = [...formattedExpenses, ...formattedIncomes].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      setTransactions(allTransactions);
      setReminders(formattedReminders);
      setAccounts(formattedAccounts);

    } catch (error) {
      console.error("Error cargando transacciones:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, sharedId]);

  // Cargar datos al abrir la app
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const refreshTransactions = () => {
    fetchTransactions();
  };

  return {
    transactions,
    reminders,
    accounts,
    loading,
    refreshTransactions,
    addTransaction: refreshTransactions,
    addReminder: refreshTransactions,
  };
}

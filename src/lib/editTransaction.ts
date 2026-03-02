import { getApiUrl } from "@/lib/config";

const API_URL = getApiUrl();

export async function editExpense(
  expenseId: string,
  userId: string,
  data: {
    macrocategoria: string;
    categoria: string;
    negocio: string;
    total_amount: number;
  }
): Promise<void> {
  const rawId = expenseId.startsWith("exp-") ? expenseId.replace("exp-", "") : expenseId;

  const res = await fetch(`${API_URL}/expenses/${rawId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, ...data }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Error desconocido" }));
    throw new Error(err.error || "Error al editar gasto");
  }
}

export async function editIncome(
  incomeId: string,
  userId: string,
  data: {
    macrocategoria: string;
    categoria: string;
    negocio: string;
    total_amount: number;
  }
): Promise<void> {
  const rawId = incomeId.startsWith("inc-") ? incomeId.replace("inc-", "") : incomeId;

  const res = await fetch(`${API_URL}/incomes/${rawId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, ...data }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Error desconocido" }));
    throw new Error(err.error || "Error al editar ingreso");
  }
}

export async function editReminder(
  reminderId: string,
  userId: string,
  data: {
    reminder_name: string;
    macrocategoria: string;
    categoria: string;
    negocio: string;
    total_amount: number;
    next_payment_date: string;
    payment_frequency: string;
    is_installment: boolean;
    installment_number: number | null;
  }
): Promise<void> {
  const res = await fetch(`${API_URL}/reminders/${reminderId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, ...data }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Error desconocido" }));
    throw new Error(err.error || "Error al editar recordatorio");
  }
}
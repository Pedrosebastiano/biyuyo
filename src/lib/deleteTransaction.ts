import { getApiUrl } from "@/lib/config";

const API_URL = getApiUrl();

export async function deleteExpense(expenseId: string, userId: string): Promise<void> {
  const rawId = expenseId.startsWith("exp-") ? expenseId.replace("exp-", "") : expenseId;

  const res = await fetch(`${API_URL}/expenses/${rawId}/zero?user_id=${userId}`, {
    method: "PATCH",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Error desconocido" }));
    throw new Error(err.error || "Error al eliminar gasto");
  }
}

export async function deleteIncome(incomeId: string, userId: string): Promise<void> {
  const rawId = incomeId.startsWith("inc-") ? incomeId.replace("inc-", "") : incomeId;

  const res = await fetch(`${API_URL}/incomes/${rawId}/zero?user_id=${userId}`, {
    method: "PATCH",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Error desconocido" }));
    throw new Error(err.error || "Error al eliminar ingreso");
  }
}

export async function deleteReminder(reminderId: string, userId: string): Promise<void> {
  const res = await fetch(`${API_URL}/reminders/${reminderId}/zero?user_id=${userId}`, {
    method: "PATCH",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Error desconocido" }));
    throw new Error(err.error || "Error al eliminar recordatorio");
  }
}

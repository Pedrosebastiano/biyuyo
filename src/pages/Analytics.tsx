import { ExpenseChart } from "@/components/dashboard/ExpenseChart";
import { IncomeExpenseChart } from "@/components/dashboard/IncomeExpenseChart";
import { MonthlySavingsChart } from "@/components/dashboard/MonthlySavingsChart";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmergencyFund } from "@/components/dashboard/EmergencyFund";
import { DebtRatio } from "@/components/dashboard/DebtRatio";
import { useState, useMemo } from "react";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { useTransactions } from "@/hooks/useTransactions";
import { APP_CONFIG } from "@/lib/config";
import { isWithinInterval, parseISO, startOfDay, endOfDay, isBefore } from "date-fns";

const Analytics = () => {
  const { transactions, reminders, accounts, loading } = useTransactions(APP_CONFIG.DEFAULT_USER_ID);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    if (!dateRange?.from) return transactions;

    const fromDate = startOfDay(dateRange.from);
    const toDate = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);

    // Si solo hay una fecha seleccionada (fromDate), mostrar todo lo anterior hasta esa fecha
    if (!dateRange.to) {
      return transactions.filter((t) => {
        const tDate = parseISO(t.date);
        return isBefore(tDate, toDate) || t.date === toDate.toISOString().split('T')[0];
      });
    }

    // Si hay un periodo, filtrar dentro del intervalo
    return transactions.filter((t) => {
      const tDate = parseISO(t.date);
      return isWithinInterval(tDate, { start: fromDate, end: toDate });
    });
  }, [transactions, dateRange]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2d509e] mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando tus datos financieros...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const hasData = transactions.length > 0 || accounts.length > 0 || reminders.length > 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#2d509e]">Análisis</h1>
            <p className="text-muted-foreground mt-1">
              Filtra y analiza tus movimientos financieros.
            </p>
          </div>
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
        </div>

        {!hasData ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
            <div className="max-w-md mx-auto">
              <h3 className="text-xl font-semibold text-[#2d509e] mb-2">No se encontraron datos</h3>
              <p className="text-muted-foreground mb-6">
                Parece que aún no tienes movimientos registrados para este usuario. Empieza agregando tus primeros gastos o ingresos.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <IncomeExpenseChart transactions={filteredTransactions} />
            <ExpenseChart transactions={filteredTransactions} />
            <MonthlySavingsChart transactions={filteredTransactions} accounts={accounts} />
            <EmergencyFund accounts={accounts} transactions={filteredTransactions} />
            <DebtRatio reminders={reminders} accounts={accounts} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Analytics;

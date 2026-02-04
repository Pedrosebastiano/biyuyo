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
import { isWithinInterval, parseISO, startOfDay, endOfDay, isBefore } from "date-fns";

const Analytics = () => {
  const { transactions, reminders, accounts, loading } = useTransactions();
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

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#2d509e]">Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Filtra y analiza tus movimientos financieros.
            </p>
          </div>
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Charts will be updated to accept filteredTransactions, reminders, and accounts as props */}
          <IncomeExpenseChart transactions={filteredTransactions} />
          <ExpenseChart transactions={filteredTransactions} />
          <MonthlySavingsChart transactions={filteredTransactions} />
          <EmergencyFund accounts={accounts} transactions={filteredTransactions} />
          <DebtRatio reminders={reminders} accounts={accounts} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;

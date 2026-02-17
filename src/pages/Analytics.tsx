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
import { useAuth } from "@/contexts/AuthContext";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { Currency } from "@/hooks/useCurrency";
import { isWithinInterval, parseISO, startOfDay, endOfDay, isBefore } from "date-fns";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight } from "lucide-react";

const Analytics = () => {
  const { user } = useAuth();
  const { transactions, reminders, accounts, loading } = useTransactions(user?.user_id || "");
  const { rate: exchangeRate } = useExchangeRate();
  const [currency, setCurrency] = useState<Currency>("USD");
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

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <p className="text-muted-foreground">Por favor inicia sesión para ver tus estadísticas</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
            <h1 className="text-3xl font-bold tracking-tight text-[#2d509e]">Estadísticas</h1>
            <p className="text-muted-foreground mt-1">
              Filtra y analiza tus movimientos financieros.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setCurrency(currency === "USD" ? "VES" : "USD")}
              className="gap-2 h-10 border-input bg-background hover:bg-accent"
            >
              <ArrowLeftRight className="h-4 w-4" />
              <span className="font-medium">
                {currency === "USD" ? "$" : "Bs."}
              </span>
              {exchangeRate && (
                <span className="text-xs text-muted-foreground">
                  {currency === "USD"
                    ? `1 = Bs. ${exchangeRate.toFixed(2)}`
                    : `1 = $ ${(1 / exchangeRate).toFixed(4)}`
                  }
                </span>
              )}
            </Button>
            <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          </div>
        </div>

        {!hasData ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
            <div className="max-w-md mx-auto">
              <h3 className="text-xl font-semibold text-[#2d509e] mb-2">No se encontraron datos</h3>
              <p className="text-muted-foreground mb-6">
                Parece que aún no tienes movimientos registrados. Empieza agregando tus primeros gastos o ingresos.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <IncomeExpenseChart transactions={filteredTransactions} currency={currency} exchangeRate={exchangeRate} />
            <ExpenseChart transactions={filteredTransactions} currency={currency} exchangeRate={exchangeRate} />
            <MonthlySavingsChart transactions={filteredTransactions} currency={currency} exchangeRate={exchangeRate} />
            <EmergencyFund accounts={accounts} transactions={filteredTransactions} currency={currency} exchangeRate={exchangeRate} />
            <DebtRatio reminders={reminders} accounts={accounts} currency={currency} exchangeRate={exchangeRate} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
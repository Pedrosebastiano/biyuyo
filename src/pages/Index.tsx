import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ExpenseChart } from "@/components/dashboard/ExpenseChart";
import { IncomeExpenseChart } from "@/components/dashboard/IncomeExpenseChart";
import { TransactionList } from "@/components/dashboard/TransactionList";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { FinancialGoals } from "@/components/dashboard/FinancialGoals";
import { useTransactions } from "@/hooks/useTransactions";
import { useAuth } from "@/contexts/AuthContext";
import { Wallet, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";

const stats = [
  {
    title: "Balance Total",
    value: "$12,450.00",
    icon: Wallet,
    trend: { value: 12.5, isPositive: true },
    variant: "success" as const,
  },
  {
    title: "Ingresos Mensuales",
    value: "$5,300.00",
    icon: TrendingUp,
    trend: { value: 8.2, isPositive: true },
    variant: "default" as const,
  },
  {
    title: "Gastos Mensuales",
    value: "$3,180.00",
    icon: TrendingDown,
    trend: { value: 3.1, isPositive: false },
    variant: "default" as const,
  },
  {
    title: "Tasa de Ahorro",
    value: "40%",
    icon: PiggyBank,
    trend: { value: 5.0, isPositive: true },
    variant: "default" as const,
  },
];

const Index = () => {
  const { user } = useAuth();
  const { transactions } = useTransactions(user?.user_id || "");

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <p className="text-muted-foreground">Por favor inicia sesión para ver tus datos</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2d509e]">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            ¡Bienvenido de nuevo, {user.name}! Aquí está tu resumen financiero.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Quick Actions - between stats and charts */}
        <QuickActions />

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <IncomeExpenseChart transactions={transactions} />
          <ExpenseChart transactions={transactions} />
        </div>

        {/* Bottom Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TransactionList />
          </div>
          <div className="space-y-6">
            <FinancialGoals />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
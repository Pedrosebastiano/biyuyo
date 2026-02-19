import { useState, useMemo, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ExpenseChart } from "@/components/dashboard/ExpenseChart";
import { IncomeExpenseChart } from "@/components/dashboard/IncomeExpenseChart";
import { TransactionList } from "@/components/dashboard/TransactionList";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { FinancialGoals } from "@/components/dashboard/FinancialGoals";
import { useTransactions } from "@/hooks/useTransactions";
import { useAuth } from "@/contexts/AuthContext";
import { Wallet, TrendingUp, TrendingDown, PiggyBank, PenLine } from "lucide-react";
import { isSameMonth, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import CombinedBubble from "@/BubbleButton/Button";
import { getApiUrl } from "@/lib/config";

const API_URL = getApiUrl();

const Index = () => {
  const { user } = useAuth();
  const { transactions } = useTransactions(user?.user_id || "");

  // Estado para el saldo inicial que viene de la tabla 'accounts'
  const [dbInitialBalance, setDbInitialBalance] = useState(0);

  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [newBalance, setNewBalance] = useState("");
  const { toast } = useToast();

  // 1. Efecto para cargar el saldo inicial de las cuentas al entrar
  useEffect(() => {
    if (user?.user_id) {
      fetch(`${API_URL}/account-balance/${user.user_id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setDbInitialBalance(data.initialBalance);
        })
        .catch(err => console.error("Error cargando balance de cuentas", err));
    }
  }, [user]);

  // 2. Lógica de Cálculos (KPIs)
  const stats = useMemo(() => {
    if (!user) return [];

    const currentMonth = new Date();

    // Total histórico de ingresos y gastos
    const totalIncomeAllTime = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenseAllTime = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Totales del MES ACTUAL
    const monthlyIncome = transactions
      .filter(t => t.type === 'income' && isSameMonth(parseISO(t.date), currentMonth))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const monthlyExpense = transactions
      .filter(t => t.type === 'expense' && isSameMonth(parseISO(t.date), currentMonth))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // FÓRMULA MAESTRA:
    // Saldo en Cuentas (base) + Ingresos Históricos - Gastos Históricos
    const totalBalance = dbInitialBalance + totalIncomeAllTime - totalExpenseAllTime;

    return [
      {
        title: "Balance Total",
        value: `$${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        icon: Wallet,
        trend: { value: 0, isPositive: totalBalance >= 0 },
        variant: totalBalance >= 0 ? "success" : "destructive",
      },
      {
        title: "Ingresos Mensuales",
        value: `$${monthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        icon: TrendingUp,
        trend: { value: 0, isPositive: true },
        variant: "default",
      },
      {
        title: "Gastos Mensuales",
        value: `$${monthlyExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        icon: TrendingDown,
        trend: { value: 0, isPositive: false },
        variant: "default",
      },
    ];
  }, [transactions, user, dbInitialBalance]); // Se recalcula si cambia el dbInitialBalance

  const handleUpdateBalance = async () => {
    if (!user) return;
    try {
      // Usamos la nueva ruta que actualiza la tabla 'accounts'
      const response = await fetch(`${API_URL}/set-initial-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.user_id,
          amount: parseFloat(newBalance)
        })
      });

      if (response.ok) {
        toast({ title: "Saldo actualizado", description: "Tu cuenta principal ha sido actualizada." });
        setDbInitialBalance(parseFloat(newBalance)); // Actualizamos visualmente al instante
        setIsBalanceModalOpen(false);
      }
    } catch (error) {
      toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" });
    }
  };

  if (!user) {
    return <DashboardLayout><div className="flex justify-center h-[60vh] pt-20">Cargando...</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#2d509e]">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Hola, {user.name}. Aquí está tu resumen financiero.
            </p>
          </div>

          <Dialog open={isBalanceModalOpen} onOpenChange={setIsBalanceModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <PenLine className="h-4 w-4" />
                Ajustar Saldo Inicial
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Saldo Cuenta Principal</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Establece el monto de inicio de tu cuenta principal (Efectivo/Banco).
                </p>
                <div className="space-y-2">
                  <Label>Monto</Label>
                  <Input
                    type="number"
                    placeholder="Ej: 5000"
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleUpdateBalance}>Guardar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} variant={stat.variant as "default" | "success" | "warning" | "destructive"} />
          ))}
        </div>

        <QuickActions />

        <div className="grid gap-6 lg:grid-cols-2">
          <IncomeExpenseChart transactions={transactions} />
          <ExpenseChart transactions={transactions} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TransactionList userId={user.user_id} />
          </div>
        </div>
      </div>
      <CombinedBubble />
    </DashboardLayout>
  );
};

export default Index;

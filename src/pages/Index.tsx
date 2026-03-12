import React, { useState, useMemo, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ExpenseChart } from "@/components/dashboard/ExpenseChart";
import { IncomeExpenseChart } from "@/components/dashboard/IncomeExpenseChart";
import { TransactionList } from "@/components/dashboard/TransactionList";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { FinancialGoals } from "@/components/dashboard/FinancialGoals";
import { useTransactions } from "@/hooks/useTransactions";
import { useAuth } from "@/contexts/AuthContext";
import { useSharedProfile } from "@/contexts/SharedProfileContext";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { PrivacyToggle } from "@/components/ui/PrivacyToggle";
import { Wallet, TrendingUp, TrendingDown, PenLine } from "lucide-react";
import { isSameMonth, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import CombinedBubble from "@/BubbleButton/Button";
import { getApiUrl } from "@/lib/config";

const API_URL = getApiUrl();

// Constante de máscara — lo que se muestra cuando privacidad está activa
const MASKED = "$••••••";

const Index = () => {
  const { user } = useAuth();
  const { activeSharedProfile } = useSharedProfile();

  // isPrivacyMode se lee directamente — NO se mete en useMemo
  const { isPrivacyMode } = usePrivacy();

  const { transactions } = useTransactions(
    user?.user_id || "",
    activeSharedProfile?.shared_id || null
  );

  const [dbInitialBalance, setDbInitialBalance] = useState(0);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [newBalance, setNewBalance] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (user?.user_id) {
      const sharedIdParam = activeSharedProfile
        ? `?sharedId=${activeSharedProfile.shared_id}`
        : `?userId=${user.user_id}`;
      fetch(`${API_URL}/account-balance/${user.user_id}${sharedIdParam}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setDbInitialBalance(data.initialBalance);
        })
        .catch((err) => console.error("Error cargando balance de cuentas", err));
    }
  }, [user, activeSharedProfile]);

  // ─── Cálculos NUMÉRICOS puros — sin tocar isPrivacyMode ───────────────────
  // Este useMemo solo se recalcula cuando cambian las transacciones o el balance.
  // NO depende de isPrivacyMode ni de ninguna función de masking.
  const rawStats = useMemo(() => {
    if (!user) return { totalBalance: 0, monthlyIncome: 0, monthlyExpense: 0 };

    const currentMonth = new Date();

    const totalIncomeAllTime = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenseAllTime = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const monthlyIncome = transactions
      .filter(
        (t) => t.type === "income" && isSameMonth(parseISO(t.date), currentMonth)
      )
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const monthlyExpense = transactions
      .filter(
        (t) => t.type === "expense" && isSameMonth(parseISO(t.date), currentMonth)
      )
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      totalBalance: dbInitialBalance + totalIncomeAllTime - totalExpenseAllTime,
      monthlyIncome,
      monthlyExpense,
    };
  }, [transactions, user, dbInitialBalance]);
  // ──────────────────────────────────────────────────────────────────────────

  // ─── Formateo con máscara — reactivo a isPrivacyMode en tiempo de render ──
  // Se construye en cada render; es barato porque solo son 3 strings.
  // Al cambiar isPrivacyMode React re-renderiza y estos valores se actualizan
  // instantáneamente sin race conditions ni recreación de callbacks.
  const fmt = (n: number) =>
    `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  const displayBalance = isPrivacyMode ? MASKED : fmt(rawStats.totalBalance);
  const displayIncome = isPrivacyMode ? MASKED : fmt(rawStats.monthlyIncome);
  const displayExpense = isPrivacyMode ? MASKED : fmt(rawStats.monthlyExpense);

  const stats = [
    {
      title: "Balance Total",
      value: displayBalance,
      icon: Wallet,
      trend: { value: 0, isPositive: rawStats.totalBalance >= 0 },
      variant: rawStats.totalBalance >= 0 ? "success" : "destructive",
    },
    {
      title: "Ingresos Mensuales",
      value: displayIncome,
      icon: TrendingUp,
      trend: { value: 0, isPositive: true },
      variant: "default",
    },
    {
      title: "Gastos Mensuales",
      value: displayExpense,
      icon: TrendingDown,
      trend: { value: 0, isPositive: false },
      variant: "default",
    },
  ];
  // ──────────────────────────────────────────────────────────────────────────

  const handleUpdateBalance = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_URL}/set-initial-balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.user_id,
          amount: parseFloat(newBalance),
        }),
      });
      if (response.ok) {
        toast({
          title: "Saldo actualizado",
          description: "Tu cuenta principal ha sido actualizada.",
        });
        setDbInitialBalance(parseFloat(newBalance));
        setIsBalanceModalOpen(false);
      }
    } catch {
      toast({
        title: "Error",
        description: "No se pudo actualizar",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex justify-center h-[60vh] pt-20">Cargando...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6" data-onboarding="dashboard-content">
        {/* ── Encabezado de página ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              {activeSharedProfile
                ? `Perfil compartido: ${activeSharedProfile.name}`
                : `Hola, ${user.name}. Aquí está tu resumen financiero.`}
            </p>
          </div>

          {/* ── Botones de acción: Ajustar Saldo + Privacidad (juntos) ── */}
          <div className="flex items-center gap-2">
            {/* Botón Ajustar Saldo Inicial */}
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
                    Establece el monto de inicio de tu cuenta principal
                    (Efectivo/Banco).
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

            {/* ── Botón Modo Privacidad — justo a la derecha de Ajustar Saldo ── */}
            <PrivacyToggle />
          </div>
        </div>

        {/* ── Tarjetas KPI ── */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCard
              key={stat.title}
              {...stat}
              variant={
                stat.variant as "default" | "success" | "warning" | "destructive"
              }
            />
          ))}
        </div>

        <QuickActions />

        {/* ── Gráficos ── */}
        <div className="grid gap-6 lg:grid-cols-2">
          <IncomeExpenseChart transactions={transactions} />
          <ExpenseChart transactions={transactions} />
        </div>

        {/* ── Transacciones recientes ── */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TransactionList
              userId={user.user_id}
              sharedId={activeSharedProfile?.shared_id || null}
            />
          </div>
        </div>
      </div>

      <CombinedBubble />
    </DashboardLayout>
  );
};

export default Index;
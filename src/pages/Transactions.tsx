import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TransactionCard } from "@/components/transactions/TransactionCard";
import { ReminderCard } from "@/components/transactions/ReminderCard";
import { TransactionFilters, FilterState } from "@/components/transactions/TransactionFilters";
import { AddTransactionDialog } from "@/components/transactions/AddTransactionDialog";
import { Plus } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";

const defaultFilters: FilterState = {
  category: "",
  minAmount: "",
  maxAmount: "",
  startDate: undefined,
  endDate: undefined,
  sortBy: "date",
  sortOrder: "desc",
};

export default function Transactions() {
  const { transactions, reminders } = useTransactions();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("expenses");
  const [expenseFilters, setExpenseFilters] = useState<FilterState>(defaultFilters);
  const [incomeFilters, setIncomeFilters] = useState<FilterState>(defaultFilters);
  const [reminderFilters, setReminderFilters] = useState<FilterState>({
    ...defaultFilters,
    sortBy: "dueDate",
  });
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);

  // Handle tab query parameter from URL
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "reminders") {
      setActiveTab("reminders");
    } else if (tab === "income") {
      setActiveTab("income");
    } else if (tab === "expenses") {
      setActiveTab("expenses");
    }
  }, [searchParams]);

  const expenses = transactions.filter((t) => t.type === "expense");
  const income = transactions.filter((t) => t.type === "income");

  const expenseMacroCategoryNames = Array.from(
    new Set(expenses.map((e) => e.macroCategory))
  );
  const incomeMacroCategoryNames = Array.from(
    new Set(income.map((i) => i.macroCategory))
  );
  const reminderMacroCategoryNames = Array.from(
    new Set(reminders.map((r) => r.macroCategory))
  );

  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    if (expenseFilters.category) {
      result = result.filter((e) => e.macroCategory === expenseFilters.category);
    }
    if (expenseFilters.minAmount) {
      result = result.filter((e) => e.amount >= parseFloat(expenseFilters.minAmount));
    }
    if (expenseFilters.maxAmount) {
      result = result.filter((e) => e.amount <= parseFloat(expenseFilters.maxAmount));
    }
    if (expenseFilters.startDate) {
      result = result.filter((e) => new Date(e.date) >= expenseFilters.startDate!);
    }
    if (expenseFilters.endDate) {
      result = result.filter((e) => new Date(e.date) <= expenseFilters.endDate!);
    }

    result.sort((a, b) => {
      const order = expenseFilters.sortOrder === "asc" ? 1 : -1;
      if (expenseFilters.sortBy === "amount") {
        return (a.amount - b.amount) * order;
      }
      if (expenseFilters.sortBy === "category") {
        return a.macroCategory.localeCompare(b.macroCategory) * order;
      }
      return (new Date(a.date).getTime() - new Date(b.date).getTime()) * order;
    });

    return result;
  }, [expenses, expenseFilters]);

  const filteredIncome = useMemo(() => {
    let result = [...income];

    if (incomeFilters.category) {
      result = result.filter((e) => e.macroCategory === incomeFilters.category);
    }
    if (incomeFilters.minAmount) {
      result = result.filter((e) => e.amount >= parseFloat(incomeFilters.minAmount));
    }
    if (incomeFilters.maxAmount) {
      result = result.filter((e) => e.amount <= parseFloat(incomeFilters.maxAmount));
    }
    if (incomeFilters.startDate) {
      result = result.filter((e) => new Date(e.date) >= incomeFilters.startDate!);
    }
    if (incomeFilters.endDate) {
      result = result.filter((e) => new Date(e.date) <= incomeFilters.endDate!);
    }

    result.sort((a, b) => {
      const order = incomeFilters.sortOrder === "asc" ? 1 : -1;
      if (incomeFilters.sortBy === "amount") {
        return (a.amount - b.amount) * order;
      }
      if (incomeFilters.sortBy === "category") {
        return a.macroCategory.localeCompare(b.macroCategory) * order;
      }
      return (new Date(a.date).getTime() - new Date(b.date).getTime()) * order;
    });

    return result;
  }, [income, incomeFilters]);

  const filteredReminders = useMemo(() => {
    let result = [...reminders];

    if (reminderFilters.category) {
      result = result.filter((e) => e.macroCategory === reminderFilters.category);
    }
    if (reminderFilters.minAmount) {
      result = result.filter((e) => e.amount >= parseFloat(reminderFilters.minAmount));
    }
    if (reminderFilters.maxAmount) {
      result = result.filter((e) => e.amount <= parseFloat(reminderFilters.maxAmount));
    }
    if (reminderFilters.startDate) {
      result = result.filter((e) => e.nextDueDate >= reminderFilters.startDate!);
    }
    if (reminderFilters.endDate) {
      result = result.filter((e) => e.nextDueDate <= reminderFilters.endDate!);
    }

    // Always sort by due date ascending (soonest/overdue first) by default
    result.sort((a, b) => {
      if (reminderFilters.sortBy === "amount") {
        const order = reminderFilters.sortOrder === "asc" ? 1 : -1;
        return (a.amount - b.amount) * order;
      }
      if (reminderFilters.sortBy === "category") {
        const order = reminderFilters.sortOrder === "asc" ? 1 : -1;
        return a.macroCategory.localeCompare(b.macroCategory) * order;
      }
      // Default: sort by due date ascending (soonest first, overdue at top)
      return a.nextDueDate.getTime() - b.nextDueDate.getTime();
    });

    return result;
  }, [reminders, reminderFilters]);

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72">
        <Sidebar />
      </div>

      <MobileHeader/>

      <div className="lg:pl-72">
        <div className="hidden lg:block">
          <Header />
        </div>

        <main className="p-4 pt-20 pb-20 lg:p-6 lg:pt-6 lg:pb-6">
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#2d509e]">
                  Transacciones
              </h1>
              <p className="text-muted-foreground mt-1">
                  Gestiona tus gastos, ingresos y recordatorios.
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="expenses">Gastos</TabsTrigger>
                <TabsTrigger value="income">Ingresos</TabsTrigger>
                <TabsTrigger value="reminders">Recordatorios</TabsTrigger>
              </TabsList>

              <TabsContent value="expenses" className="space-y-4 mt-4">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => setIsTransactionDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Agregar Transacción
                  </Button>
                  <TransactionFilters
                    filters={expenseFilters}
                    onFiltersChange={setExpenseFilters}
                    categories={expenseMacroCategoryNames}
                  />
                </div>
                <div className="space-y-3">
                  {filteredExpenses.map((expense) => (
                    <TransactionCard key={expense.id} {...expense} />
                  ))}
                  {filteredExpenses.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No hay gastos que coincidan con los filtros
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="income" className="space-y-4 mt-4">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => setIsTransactionDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Agregar Transacción
                  </Button>
                  <TransactionFilters
                    filters={incomeFilters}
                    onFiltersChange={setIncomeFilters}
                    categories={incomeMacroCategoryNames}
                  />
                </div>
                <div className="space-y-3">
                  {filteredIncome.map((income) => (
                    <TransactionCard key={income.id} {...income} />
                  ))}
                  {filteredIncome.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No hay ingresos que coincidan con los filtros
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="reminders" className="space-y-4 mt-4">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => setIsTransactionDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Agregar Transacción
                  </Button>
                  <TransactionFilters
                    filters={reminderFilters}
                    onFiltersChange={setReminderFilters}
                    categories={reminderMacroCategoryNames}
                    showDueDateSort
                  />
                </div>
                <div className="space-y-3">
                  {filteredReminders.map((reminder) => (
                    <ReminderCard key={reminder.id} {...reminder} />
                  ))}
                  {filteredReminders.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No hay recordatorios que coincidan con los filtros
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      <BottomNav />

      <AddTransactionDialog
        open={isTransactionDialogOpen}
        onOpenChange={setIsTransactionDialogOpen}
      />
    </div>
  );
}
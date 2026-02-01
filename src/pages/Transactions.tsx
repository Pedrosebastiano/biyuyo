import { useState, useMemo } from "react";
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
import { macroCategories } from "@/data/categories";
import { incomeMacroCategories } from "@/data/incomeCategories";
import { reminderMacroCategories } from "@/data/reminderCategories";

// Mock data for expenses
const mockExpenses = [
  {
    id: 1,
    type: "expense" as const,
    amount: 85.50,
    currency: "USD" as const,
    macroCategory: "Alimentos y bebidas",
    category: "Supermercados y abastos",
    business: "Supermercados",
    date: "2024-02-01",
  },
  {
    id: 2,
    type: "expense" as const,
    amount: 1200.00,
    currency: "USD" as const,
    macroCategory: "Vivienda y hogar",
    category: "Vivienda",
    business: "Alquiler",
    date: "2024-02-01",
  },
  {
    id: 3,
    type: "expense" as const,
    amount: 45.00,
    currency: "USD" as const,
    macroCategory: "Transporte y movilidad",
    category: "Vehículo propio",
    business: "Gasolineras",
    date: "2024-01-30",
  },
  {
    id: 4,
    type: "expense" as const,
    amount: 2500.00,
    currency: "VES" as const,
    macroCategory: "Salud y bienestar",
    category: "Farmacias y cuidado",
    business: "Farmacias",
    date: "2024-01-28",
  },
];

// Mock data for income
const mockIncome = [
  {
    id: 1,
    type: "income" as const,
    amount: 4500.00,
    currency: "USD" as const,
    macroCategory: "Ingresos laborales",
    category: "Empleo fijo",
    business: "Empresa privada",
    date: "2024-02-01",
  },
  {
    id: 2,
    type: "income" as const,
    amount: 800.00,
    currency: "USD" as const,
    macroCategory: "Trabajo independiente / freelance",
    category: "Freelance digital",
    business: "Clientes directos",
    date: "2024-01-28",
  },
  {
    id: 3,
    type: "income" as const,
    amount: 150.00,
    currency: "USD" as const,
    macroCategory: "Inversiones y rendimientos",
    category: "Criptomonedas",
    business: "Staking",
    date: "2024-01-25",
  },
];

// Mock data for reminders
const mockReminders = [
  {
    id: 1,
    name: "Alquiler mensual",
    amount: 1200.00,
    currency: "USD" as const,
    macroCategory: "Vivienda y servicios del hogar",
    category: "Vivienda",
    business: "Alquiler",
    nextDueDate: new Date("2024-02-05"),
    frequency: "Mensual",
    isInstallment: false,
  },
  {
    id: 2,
    name: "Netflix",
    amount: 15.99,
    currency: "USD" as const,
    macroCategory: "Suscripciones y servicios digitales",
    category: "Streaming y entretenimiento",
    business: "Netflix",
    nextDueDate: new Date("2024-02-10"),
    frequency: "Mensual",
    isInstallment: false,
  },
  {
    id: 3,
    name: "Préstamo Cashea",
    amount: 50.00,
    currency: "USD" as const,
    macroCategory: "Créditos y financiamientos",
    category: "Apps de financiamiento",
    business: "Cashea",
    nextDueDate: new Date("2024-02-03"),
    frequency: "Quincenal",
    isInstallment: true,
    currentInstallment: 3,
    totalInstallments: 6,
  },
  {
    id: 4,
    name: "Seguro vehicular",
    amount: 200.00,
    currency: "USD" as const,
    macroCategory: "Transporte y vehículo",
    category: "Vehículo propio",
    business: "Seguro vehicular",
    nextDueDate: new Date("2024-02-15"),
    frequency: "Mensual",
    isInstallment: false,
  },
];

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
  const [activeTab, setActiveTab] = useState("expenses");
  const [expenseFilters, setExpenseFilters] = useState<FilterState>(defaultFilters);
  const [incomeFilters, setIncomeFilters] = useState<FilterState>(defaultFilters);
  const [reminderFilters, setReminderFilters] = useState<FilterState>({
    ...defaultFilters,
    sortBy: "dueDate",
  });
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);

  // Get unique macro categories for filters
  const expenseMacroCategoryNames = macroCategories.map((c) => c.name);
  const incomeMacroCategoryNames = incomeMacroCategories.map((c) => c.name);
  const reminderMacroCategoryNames = reminderMacroCategories.map((c) => c.name);

  // Filter and sort expenses
  const filteredExpenses = useMemo(() => {
    let result = [...mockExpenses];

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
  }, [expenseFilters]);

  // Filter and sort income
  const filteredIncome = useMemo(() => {
    let result = [...mockIncome];

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
  }, [incomeFilters]);

  // Filter and sort reminders
  const filteredReminders = useMemo(() => {
    let result = [...mockReminders];

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

    result.sort((a, b) => {
      const order = reminderFilters.sortOrder === "asc" ? 1 : -1;
      if (reminderFilters.sortBy === "amount") {
        return (a.amount - b.amount) * order;
      }
      if (reminderFilters.sortBy === "category") {
        return a.macroCategory.localeCompare(b.macroCategory) * order;
      }
      if (reminderFilters.sortBy === "dueDate") {
        return (a.nextDueDate.getTime() - b.nextDueDate.getTime()) * order;
      }
      return (a.nextDueDate.getTime() - b.nextDueDate.getTime()) * order;
    });

    return result;
  }, [reminderFilters]);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72">
        <Sidebar />
      </div>

      {/* Mobile Header */}
      <MobileHeader exchangeRate={36.50} />

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Desktop Header */}
        <div className="hidden lg:block">
          <Header />
        </div>

        <main className="p-4 pt-18 pb-20 lg:p-6 lg:pt-6 lg:pb-6">
          <div className="space-y-4">
            {/* Page Title */}
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight">
                Transacciones
              </h1>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => setIsTransactionDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Agregar</span>
              </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="expenses">Gastos</TabsTrigger>
                <TabsTrigger value="income">Ingresos</TabsTrigger>
                <TabsTrigger value="reminders">Recordatorios</TabsTrigger>
              </TabsList>

              {/* Expenses Tab */}
              <TabsContent value="expenses" className="space-y-4 mt-4">
                <div className="flex justify-end">
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

              {/* Income Tab */}
              <TabsContent value="income" className="space-y-4 mt-4">
                <div className="flex justify-end">
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

              {/* Reminders Tab */}
              <TabsContent value="reminders" className="space-y-4 mt-4">
                <div className="flex justify-end">
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

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Add Transaction Dialog */}
      <AddTransactionDialog
        open={isTransactionDialogOpen}
        onOpenChange={setIsTransactionDialogOpen}
      />
    </div>
  );
}

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingDown, TrendingUp, Bell } from "lucide-react";
import { ExpenseForm } from "./ExpenseForm";
import { IncomeForm } from "./IncomeForm";
import { ReminderForm } from "./ReminderForm";

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: string;
  initialData?: any;
}

export function AddTransactionDialog({ open, onOpenChange, initialTab = "expense", initialData }: AddTransactionDialogProps) {
  const [activeTab, setActiveTab] = useState(initialTab);

  const tabLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    expense:  { label: "Gasto",        icon: <TrendingDown className="h-3.5 w-3.5" />, color: "text-destructive bg-destructive/10" },
    income:   { label: "Ingreso",      icon: <TrendingUp   className="h-3.5 w-3.5" />, color: "text-green-600 bg-green-500/10" },
    reminder: { label: "Recordatorio", icon: <Bell         className="h-3.5 w-3.5" />, color: "text-amber-500 bg-amber-500/10" },
  };
  const current = tabLabels[activeTab];

  // When dialog opens/closes, or when initialTab changes, update activeTab
  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-2 max-h-[90vh] overflow-y-auto" data-onboarding="transaction-dialog-content">
        <DialogHeader>
          <div className="flex flex-col items-center gap-1">
            <DialogTitle className="text-xl font-bold">Nueva Transacción</DialogTitle>
            {current && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${current.color}`}>
                {current.icon}
                {current.label}
              </span>
            )}
          </div>
          <DialogDescription className="hidden">Agrega una nueva transacción a tu registro.</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4" data-onboarding="transaction-dialog-tabs">
            <TabsTrigger value="expense" className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              <span className="hidden sm:inline">Gasto</span>
            </TabsTrigger>
            <TabsTrigger value="income" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Ingreso</span>
            </TabsTrigger>
            <TabsTrigger value="reminder" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Recordatorio</span>
            </TabsTrigger>
          </TabsList>

          {/* Expense Tab */}
          <TabsContent value="expense">
            <ExpenseForm onSubmit={handleClose} initialData={initialData} />
          </TabsContent>

          {/* Income Tab */}
          <TabsContent value="income">
            <IncomeForm onSubmit={handleClose} initialData={initialData} />
          </TabsContent>

          {/* Reminder Tab */}
          <TabsContent value="reminder">
            <ReminderForm onSubmit={handleClose} initialData={initialData} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

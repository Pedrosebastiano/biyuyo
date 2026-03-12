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
          <DialogTitle className="text-xl font-bold">Nueva Transacción</DialogTitle>
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

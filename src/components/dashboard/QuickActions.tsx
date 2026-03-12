import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, TrendingUp } from "lucide-react";
import { AddTransactionDialog } from "@/components/transactions/AddTransactionDialog";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "@/contexts/OnboardingContext";

export function QuickActions() {
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { registerAction, unregisterAction } = useOnboarding();

  // Register onboarding actions to open/close the transaction dialog
  useEffect(() => {
    registerAction("open-transaction-dialog", () => {
      setIsTransactionDialogOpen(true);
    });
    registerAction("close-transaction-dialog", () => {
      setIsTransactionDialogOpen(false);
    });
    return () => {
      unregisterAction("open-transaction-dialog");
      unregisterAction("close-transaction-dialog");
    };
  }, [registerAction, unregisterAction]);

  const actions = [
    { label: "Agregar Transacción", shortLabel: "Agregar", icon: Plus, variant: "default" as const, onClick: () => setIsTransactionDialogOpen(true) },
    { label: "Ver Análisis", shortLabel: "Análisis", icon: TrendingUp, variant: "outline" as const, onClick: () => navigate("/analytics") },
  ];

  return (
    <>
      <Card className="border-2" data-onboarding="quick-actions">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant}
              className="h-auto py-4 flex-col gap-2 border-2 min-h-[80px]"
              onClick={action.onClick}
              {...(action.label === "Agregar Transacción" ? { "data-onboarding": "add-transaction-btn" } : {})}
            >
              <action.icon className="h-5 w-5 shrink-0" />
              <span className="text-xs lg:text-sm text-center leading-tight hidden lg:inline">{action.label}</span>
              <span className="text-xs text-center leading-tight lg:hidden">{action.shortLabel}</span>
            </Button>
          ))}
        </CardContent>
      </Card>

      <AddTransactionDialog 
        open={isTransactionDialogOpen} 
        onOpenChange={setIsTransactionDialogOpen} 
      />
    </>
  );
}

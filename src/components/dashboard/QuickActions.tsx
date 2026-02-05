import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, TrendingUp } from "lucide-react";
import { AddTransactionDialog } from "@/components/transactions/AddTransactionDialog";
import { useNavigate } from "react-router-dom";

export function QuickActions() {
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const navigate = useNavigate();

  const actions = [
    { label: "Agregar Transacción", shortLabel: "Agregar", icon: Plus, variant: "default" as const, onClick: () => setIsTransactionDialogOpen(true) },
    { label: "Ver Análisis", shortLabel: "Análisis", icon: TrendingUp, variant: "outline" as const, onClick: () => navigate("/analytics") },
  ];

  return (
    <>
      <Card className="border-2">
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

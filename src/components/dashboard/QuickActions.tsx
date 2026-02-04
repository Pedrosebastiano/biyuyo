import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, TrendingUp, Users } from "lucide-react";
import { AddTransactionDialog } from "@/components/transactions/AddTransactionDialog";

export function QuickActions() {
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);

  const actions = [
    { label: "Agregar Transacción", icon: Plus, variant: "default" as const, onClick: () => setIsTransactionDialogOpen(true) },
    { label: "Cuentas Compartidas", icon: Users, variant: "outline" as const, onClick: () => {} },
    { label: "Ver Análisis", icon: TrendingUp, variant: "outline" as const, onClick: () => {} },
  ];

  return (
    <>
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant}
              className="h-auto py-4 flex-col gap-2 border-2"
              onClick={action.onClick}
            >
              <action.icon className="h-5 w-5" />
              <span className="text-sm">{action.label}</span>
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

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, TrendingUp, Users, Calculator, BellRing } from "lucide-react";
import { AddTransactionDialog } from "@/components/transactions/AddTransactionDialog";
// Importamos tus servicios de notificaciones
import { usePushNotification } from "@/hooks/use-push-notification";
import { localNotificationService } from "@/services/local-notification-service";

export function QuickActions() {
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);

  // Inicializamos el hook de Push (Firebase)
  const { fcmToken } = usePushNotification();

  const handleTestNotification = async () => {
    // 1. Pedir permiso explícito si no lo tiene
    const permission = await localNotificationService.requestPermission();

    if (permission === "granted") {
      // 2. Disparar una notificación local inmediata
      localNotificationService.displayNotification("¡Biyuyo funcionando!", {
        body: "Las notificaciones locales y el sistema Push están activos.",
        requireInteraction: true
      });

      // 3. Programar una para dentro de 10 segundos (para probar el segundo plano)
      const future = new Date(Date.now() + 10000);
      localNotificationService.scheduleNotification(
        "test-debt",
        "Recordatorio de Deuda",
        future,
        { body: "Esta es una simulación de una deuda vencida." }
      );

      console.log("Token FCM actual:", fcmToken);
    }
  };

  const actions = [
    { label: "Agregar Transacción", shortLabel: "Agregar", icon: Plus, variant: "default" as const, onClick: () => setIsTransactionDialogOpen(true) },
    { label: "Cuentas Compartidas", shortLabel: "Compartidas", icon: Users, variant: "outline" as const, onClick: () => { } },
    // BOTÓN DE PRUEBA TEMPORAL
    { label: "Probar Notis", shortLabel: "Notis", icon: BellRing, variant: "outline" as const, onClick: handleTestNotification },
    { label: "Predecir Gastos", shortLabel: "Predecir", icon: Calculator, variant: "outline" as const, onClick: () => { } },
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
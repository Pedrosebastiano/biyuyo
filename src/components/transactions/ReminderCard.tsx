import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CalendarClock, Trash2, CheckCircle2, Pencil } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { deleteReminder } from "@/lib/deleteTransaction";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/config";
import { EditReminderDialog } from "./EditReminderDialog";
import { useTransactions } from "@/hooks/useTransactions";
import { useSharedProfile } from "@/contexts/SharedProfileContext";

const API_URL = getApiUrl();

const translateFrequency = (frequency: string): string => {
  const translations: Record<string, string> = {
    daily: "Diario",
    weekly: "Semanal",
    biweekly: "Quincenal",
    monthly: "Mensual",
    yearly: "Anual",
  };
  return translations[frequency.toLowerCase()] || frequency;
};

interface ReminderCardProps {
  id: string;
  name: string;
  amount: number;
  currency: "USD" | "VES";
  macroCategory: string;
  category: string;
  business: string;
  nextDueDate: Date;
  frequency: string;
  isInstallment?: boolean;
  currentInstallment?: number;
  totalInstallments?: number;
  invoiceImageUrl?: string;
  creatorName?: string;
  onDeleted?: (id: string) => void;
}

export function ReminderCard({
  id,
  name,
  amount,
  currency,
  macroCategory,
  category,
  business,
  nextDueDate,
  frequency,
  isInstallment,
  currentInstallment,
  totalInstallments,
  creatorName,
  onDeleted,
}: ReminderCardProps) {
  const { user } = useAuth();
  const { activeSharedProfile } = useSharedProfile();
  const { refreshTransactions } = useTransactions(
    user?.user_id || "",
    activeSharedProfile?.shared_id || null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const currencySymbol = currency === "USD" ? "$" : "Bs.";
  const daysUntilDue = differenceInDays(nextDueDate, new Date());

  const getDueBadgeVariant = () => {
    if (daysUntilDue < 0 || daysUntilDue <= 3) return "destructive";
    if (daysUntilDue <= 7) return "secondary";
    return "outline";
  };

  const getDueText = () => {
    if (daysUntilDue < 0) return `Vencido hace ${Math.abs(daysUntilDue)} días`;
    if (daysUntilDue === 0) return "Vence hoy";
    if (daysUntilDue === 1) return "Vence mañana";
    return `Vence en ${daysUntilDue} días`;
  };

  const handleDelete = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      await deleteReminder(id, user.user_id);
      toast.success("Recordatorio eliminado correctamente");
      onDeleted?.(id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePay = async () => {
    if (!user) return;
    setIsPaying(true);
    try {
      const res = await fetch(
        `${API_URL}/reminders/${id}/pay?user_id=${user.user_id}`,
        { method: "PATCH" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(err.error || "Error al registrar pago");
      }
      toast.success(`Pago de "${name}" registrado como gasto ✅`);
      onDeleted?.(id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al registrar pago");
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <>
      <Card className="border-2 overflow-hidden bg-card">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Información Principal */}
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <p className="font-bold text-lg truncate leading-tight">{name}</p>
                <p className="text-xs text-muted-foreground truncate italic">{business}</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-[10px] px-2 py-0">
                  {macroCategory}
                </Badge>
                {isInstallment && (
                  <Badge variant="outline" className="text-[10px] px-2 py-0 border-primary/30 text-primary">
                    Cuota {currentInstallment || 1}/{totalInstallments}
                  </Badge>
                )}
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">
                    {format(nextDueDate, "dd 'de' MMMM", { locale: es })}
                  </span>
                </div>
                <Badge variant={getDueBadgeVariant()} className="text-[10px] font-bold">
                  {getDueText()}
                </Badge>
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="flex flex-col items-end gap-3 shrink-0">
              <div className="text-right">
                <p className="font-mono font-black text-xl text-foreground leading-none">
                  <span className="text-sm font-normal mr-1">{currencySymbol}</span>
                  {amount.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] uppercase tracking-tighter text-muted-foreground font-semibold">
                  {translateFrequency(frequency)}
                </p>
                {creatorName && (
                  <p className="text-[9px] mt-1 text-primary/70 font-medium whitespace-nowrap">
                    Por: {creatorName}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1">
                {/* Botón Marcar como Pagado */}
                {user && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50"
                        disabled={isPaying}
                        title="Marcar como pagado"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Marcar como pagado?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Se registrará <strong>{name}</strong> como un gasto de{" "}
                          <strong>{currencySymbol}{amount.toFixed(2)}</strong> y el recordatorio desaparecerá.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handlePay}
                          className="bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          Sí, ya pagué
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                {/* Botón Editar */}
                {user && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                    onClick={() => setEditDialogOpen(true)}
                    title="Editar recordatorio"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}

                {/* Botón Eliminar */}
                {user && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        disabled={isDeleting}
                        title="Eliminar recordatorio"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar recordatorio?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminará permanentemente el recordatorio{" "}
                          <strong>{name}</strong> ({currencySymbol}{amount.toFixed(2)}).
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Editar */}
      {user && (
        <EditReminderDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          reminder={{
            id,
            name,
            amount,
            macroCategory,
            category,
            business,
            nextDueDate,
            frequency,
            isInstallment: isInstallment || false,
            currentInstallment,
            totalInstallments,
          }}
          onEdited={() => refreshTransactions()}
        />
      )}
    </>
  );
}
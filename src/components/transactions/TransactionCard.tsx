import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { ReceiptText, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import InvoiceButton from './InvoiceButton';
import { FeedbackButtons } from "./FeedbackButtons";
import { useAuth } from "@/contexts/AuthContext";
import { deleteExpense, deleteIncome } from "@/lib/deleteTransaction";
import { toast } from "sonner";
import { EditTransactionDialog } from "./EditTransactionDialog";
import { useTransactions } from "@/hooks/useTransactions";
import { useSharedProfile } from "@/contexts/SharedProfileContext";

interface TransactionCardProps {
  id: string;
  type: "expense" | "income";
  amount: number;
  currency: "USD" | "VES";
  macroCategory: string;
  category: string;
  business: string;
  date: string;
  receiptImage?: string;
  userFeedback?: number | null;
  creatorName?: string;
  onDeleted?: (id: string) => void;
}

export function TransactionCard({
  id,
  type,
  amount,
  currency,
  macroCategory,
  category,
  business,
  date,
  receiptImage,
  userFeedback = null,
  creatorName,
  onDeleted,
}: TransactionCardProps) {
  const { user } = useAuth();
  const { activeSharedProfile } = useSharedProfile();
  const { refreshTransactions } = useTransactions(
    user?.user_id || "",
    activeSharedProfile?.shared_id || null
  );
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const isExpense = type === "expense";
  const currencySymbol = currency === "USD" ? "$" : "Bs.";

  const handleDelete = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      if (isExpense) {
        await deleteExpense(id, user.user_id);
      } else {
        await deleteIncome(id, user.user_id);
      }
      toast.success(`${isExpense ? "Gasto" : "Ingreso"} eliminado correctamente`);
      onDeleted?.(id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="border-2 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            {/* Información Izquierda */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px] px-2 py-0 shrink-0">
                  {macroCategory}
                </Badge>
              </div>
              <p className="font-bold truncate text-foreground">{category}</p>
              <p className="text-sm text-muted-foreground truncate italic">{business}</p>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <p className="text-xs text-muted-foreground whitespace-nowrap">{date}</p>
                {creatorName && (
                  <>
                    <span className="text-xs text-muted-foreground">•</span>
                    <p className="text-[10px] font-medium text-primary bg-primary/5 px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                      {creatorName}
                    </p>
                  </>
                )}
              </div>

              {isExpense && user && (
                <div className="pt-2">
                  <FeedbackButtons
                    expenseId={id}
                    userId={user.user_id}
                    initialFeedback={userFeedback}
                  />
                </div>
              )}
            </div>

            {/* Columna Derecha */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              <span
                className={cn(
                  "font-mono font-black text-lg leading-none",
                  isExpense ? "text-destructive" : "text-emerald-600"
                )}
              >
                {isExpense ? "-" : "+"}
                {currencySymbol}
                {amount.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
              </span>

              {receiptImage && (
                <InvoiceButton
                  invoiceNumber={`REC-${business.substring(0, 3).toUpperCase()}`}
                  onClick={() => setImageDialogOpen(true)}
                  className="scale-90 origin-right"
                />
              )}

              <div className="flex items-center gap-1">
                {/* Botón Editar */}
                {user && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                    onClick={() => setEditDialogOpen(true)}
                    title={`Editar ${isExpense ? "gasto" : "ingreso"}`}
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
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar {isExpense ? "gasto" : "ingreso"}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminará permanentemente este registro de{" "}
                          <strong>{currencySymbol}{amount.toFixed(2)}</strong> en <strong>{business}</strong>.
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

      {/* Modal Factura */}
      {receiptImage && (
        <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
          <DialogContent className="max-w-md bg-slate-50 border-none shadow-2xl p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="flex items-center gap-2 text-slate-700">
                <ReceiptText className="h-5 w-5 text-primary" />
                Comprobante de Pago
              </DialogTitle>
            </DialogHeader>
            <div className="relative overflow-hidden rounded-xl border-4 border-white shadow-inner bg-white">
              <img
                src={receiptImage}
                alt="Factura"
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            </div>
            <div className="mt-4 flex justify-between items-center text-[10px] text-muted-foreground font-mono uppercase">
              <span>{business}</span>
              <span>{date}</span>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog Editar */}
      {user && (
        <EditTransactionDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          transaction={{ id, type, amount, macroCategory, category, business }}
          onEdited={() => refreshTransactions()}
        />
      )}
    </>
  );
}
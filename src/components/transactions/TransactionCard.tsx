import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface TransactionCardProps {
  type: "expense" | "income";
  amount: number;
  currency: "USD" | "VES";
  macroCategory: string;
  category: string;
  business: string;
  date: string;
  receiptImage?: string;
}

export function TransactionCard({
  type,
  amount,
  currency,
  macroCategory,
  category,
  business,
  date,
  receiptImage,
}: TransactionCardProps) {
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const isExpense = type === "expense";
  const currencySymbol = currency === "USD" ? "$" : "Bs.";

  return (
    <>
      <Card className="border-2">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs shrink-0">
                  {macroCategory}
                </Badge>
              </div>
              <p className="font-medium truncate">{category}</p>
              <p className="text-sm text-muted-foreground truncate">{business}</p>
              <p className="text-xs text-muted-foreground">{date}</p>
              
              {receiptImage && (
                <button
                  onClick={() => setImageDialogOpen(true)}
                  className="mt-2 w-full"
                >
                  <img
                    src={receiptImage}
                    alt="Factura"
                    className="w-full h-24 object-cover rounded-md border-2 border-border hover:opacity-80 transition-opacity"
                  />
                </button>
              )}
            </div>
            
            <div className="text-right shrink-0">
              <span
                className={cn(
                  "font-mono font-bold text-lg",
                  isExpense ? "text-destructive" : "text-primary"
                )}
              >
                {isExpense ? "-" : "+"}
                {currencySymbol}
                {amount.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-3xl">
          <img
            src={receiptImage}
            alt="Factura"
            className="w-full h-auto"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TransactionCardProps {
  type: "expense" | "income";
  amount: number;
  currency: "USD" | "VES";
  macroCategory: string;
  category: string;
  business: string;
  date: string;
}

export function TransactionCard({
  type,
  amount,
  currency,
  macroCategory,
  category,
  business,
  date,
}: TransactionCardProps) {
  const isExpense = type === "expense";
  const currencySymbol = currency === "USD" ? "$" : "Bs.";

  return (
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
  );
}

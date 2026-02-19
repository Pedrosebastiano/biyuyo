import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ShoppingCart,
  Home,
  Car,
  Utensils,
  Zap,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTransactions } from "@/hooks/useTransactions";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const categoryIcons: Record<string, React.ElementType> = {
  shopping: ShoppingCart,
  housing: Home,
  transport: Car,
  food: Utensils,
  utilities: Zap,
  income: Briefcase,
  reminder: Bell,
};


// 1. Definimos que este componente espera recibir un userId
interface TransactionListProps {
  userId: string | number;
  sharedId?: string | null;
}

export function TransactionList({ userId, sharedId }: TransactionListProps) {
  // 2. Pasamos ese userId al hook para que busque SOLO los datos de ese usuario
  const { transactions, reminders } = useTransactions(String(userId), sharedId || null);

  // Combinar transacciones y recordatorios
  const combinedItems = [
    ...transactions.map((t) => ({
      id: t.id,
      type: t.type,
      business: t.business,
      amount: t.amount,
      currency: t.currency,
      date: new Date(t.date),
      isReminder: false,
      createdAt: (t as any).createdAt ? new Date((t as any).createdAt) : new Date(t.date),
      creatorName: t.creatorName,
    })),
    ...reminders.map((r) => ({
      id: r.id,
      type: "reminder" as const,
      business: r.business,
      amount: r.amount,
      currency: r.currency,
      date: r.nextDueDate,
      isReminder: true,
      createdAt: (r as any).createdAt ? new Date((r as any).createdAt) : r.nextDueDate,
      creatorName: r.creatorName,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);

  return (
    <Card className="border-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">
          Transacciones Recientes
        </CardTitle>
        <Badge variant="secondary" className="font-mono">
          {combinedItems.length} items
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="divide-y divide-border">
            {combinedItems.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No hay transacciones recientes para este usuario.
              </div>
            ) : (
              combinedItems.map((item) => {
                // Use the icon based on the item's type, fallback to shopping if not found
                const Icon = categoryIcons[item.type] || ShoppingCart;
                const isIncome = item.type === "income";
                const isReminder = item.isReminder;
                const currencySymbol = item.currency === "USD" ? "$" : "Bs.";

                return (
                  <div
                    key={`${item.id}-${item.isReminder ? 'rem' : 'tx'}`}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "p-2 rounded-lg",
                          isIncome
                            ? "bg-accent"
                            : isReminder
                              ? "bg-warning/10"
                              : "bg-muted",
                        )}
                      >
                        {isReminder ? (
                          <Bell className="h-5 w-5" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{item.business}</p>
                        <p className="text-sm text-muted-foreground flex items-center flex-wrap gap-x-2">
                          <span className="whitespace-nowrap">{format(item.date, "dd MMM yyyy", { locale: es })}</span>
                          {item.creatorName && (
                            <span className="text-[10px] font-medium text-primary/70 whitespace-nowrap">
                              • {item.creatorName}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "font-mono font-semibold",
                          isIncome
                            ? "text-primary"
                            : isReminder
                              ? "text-warning"
                              : "text-foreground",
                        )}
                      >
                        {isIncome ? "+" : isReminder ? "" : "-"}
                        {currencySymbol}
                        {item.amount.toLocaleString("es-VE", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                      {isIncome ? (
                        <ArrowUpRight className="h-4 w-4 text-primary" />
                      ) : isReminder ? (
                        <Bell className="h-4 w-4 text-warning" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

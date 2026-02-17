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

export function TransactionList() {
  const { user } = useAuth();
  const { transactions, reminders } = useTransactions(user?.user_id || "");

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
          {combinedItems.length} transacciones
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="divide-y divide-border">
            {combinedItems.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No hay transacciones recientes
              </div>
            ) : (
              combinedItems.map((item) => {
                const Icon = categoryIcons.shopping;
                const isIncome = item.type === "income";
                const isReminder = item.isReminder;
                const currencySymbol = item.currency === "USD" ? "$" : "Bs.";

                return (
                  <div
                    key={item.id}
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
                        <p className="text-sm text-muted-foreground">
                          {format(item.date, "dd MMM yyyy", { locale: es })}
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

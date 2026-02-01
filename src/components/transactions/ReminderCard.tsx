import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarClock } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ReminderCardProps {
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
}

export function ReminderCard({
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
}: ReminderCardProps) {
  const currencySymbol = currency === "USD" ? "$" : "Bs.";
  const daysUntilDue = differenceInDays(nextDueDate, new Date());
  
  const getDueBadgeVariant = () => {
    if (daysUntilDue < 0) return "destructive";
    if (daysUntilDue <= 3) return "destructive";
    if (daysUntilDue <= 7) return "secondary";
    return "outline";
  };

  const getDueText = () => {
    if (daysUntilDue < 0) return `Vencido hace ${Math.abs(daysUntilDue)} días`;
    if (daysUntilDue === 0) return "Vence hoy";
    if (daysUntilDue === 1) return "Vence mañana";
    return `Vence en ${daysUntilDue} días`;
  };

  return (
    <Card className="border-2">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            <p className="font-semibold truncate">{name}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {macroCategory}
              </Badge>
              {isInstallment && totalInstallments && (
                <Badge variant="outline" className="text-xs">
                  Cuota {currentInstallment}/{totalInstallments}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">{category}</p>
            <p className="text-xs text-muted-foreground truncate">{business}</p>
            
            <div className="flex items-center gap-2 pt-1">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {format(nextDueDate, "dd MMM yyyy", { locale: es })}
              </span>
              <Badge variant={getDueBadgeVariant()} className="text-xs">
                {getDueText()}
              </Badge>
            </div>
          </div>
          
          <div className="text-right shrink-0">
            <span className="font-mono font-bold text-lg text-foreground">
              {currencySymbol}
              {amount.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
            </span>
            <p className="text-xs text-muted-foreground">{frequency}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

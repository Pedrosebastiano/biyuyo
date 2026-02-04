import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarClock } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import InvoiceButton from './InvoiceButton';

// Función para traducir frecuencias
const translateFrequency = (frequency: string): string => {
  const translations: Record<string, string> = {
    'daily': 'Diario',
    'weekly': 'Semanal',
    'biweekly': 'Quincenal',
    'monthly': 'Mensual',
    'yearly': 'Anual',
  };

  return translations[frequency.toLowerCase()] || frequency;
};

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
  invoiceImageUrl?: string;
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

  return (
    <Card className="border-2 overflow-hidden bg-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Información Principal (Izquierda) */}
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
          
          {/* Columna de Acción (Derecha) */}
          <div className="flex flex-col items-end gap-3 shrink-0">
            <div className="text-right">
              <p className="font-mono font-black text-xl text-foreground leading-none">
                <span className="text-sm font-normal mr-1">{currencySymbol}</span>
                {amount.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] uppercase tracking-tighter text-muted-foreground font-semibold">
                {translateFrequency(frequency)}
              </p>
            </div>

            {/* AQUÍ ESTÁ EL BOTÓN DE PAPELITO */}
            <InvoiceButton 
              invoiceNumber={`INV-${name.substring(0,3).toUpperCase()}`}
              onClick={() => alert(`Abriendo factura de ${name}`)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
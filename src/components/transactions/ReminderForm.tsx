import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  reminderMacroCategories,
  getReminderCategoriesByMacro,
  getReminderBusinessTypesByCategory,
  paymentFrequencies,
  type Category,
  type BusinessType,
  type PaymentFrequency,
} from "@/data/reminderCategories";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CurrencySelector, type Currency } from "./CurrencySelector";
import { useTransactions } from "@/hooks/useTransactions";
import { toast } from "sonner";

// TU ID DE SUPABASE
const USER_ID = "6221431c-7a17-4acc-9c01-43903e30eb21";

interface ReminderFormProps {
  onSubmit: () => void;
}

export function ReminderForm({ onSubmit }: ReminderFormProps) {
  const { refreshTransactions } = useTransactions();
  
  const [selectedMacro, setSelectedMacro] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedBusiness, setSelectedBusiness] = useState<string>("");
  const [customBusiness, setCustomBusiness] = useState<string>("");
  const [paymentName, setPaymentName] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [nextPaymentDate, setNextPaymentDate] = useState<Date | undefined>();
  const [frequency, setFrequency] = useState<PaymentFrequency | "">("");
  const [hasInstallments, setHasInstallments] = useState<boolean>(false);
  const [totalInstallments, setTotalInstallments] = useState<string>("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories: Category[] = selectedMacro
    ? getReminderCategoriesByMacro(selectedMacro)
    : [];
  const businessTypes: BusinessType[] =
    selectedMacro && selectedCategory
      ? getReminderBusinessTypesByCategory(selectedMacro, selectedCategory)
      : [];

  const handleMacroChange = (value: string) => {
    setSelectedMacro(value);
    setSelectedCategory("");
    setSelectedBusiness("");
    setCustomBusiness("");
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setSelectedBusiness("");
    setCustomBusiness("");
  };

  const handleBusinessChange = (value: string) => {
    setSelectedBusiness(value);
    if (value !== "custom") {
      setCustomBusiness("");
    }
  };

  const handleSubmit = async () => {
    // Validación de fecha
    if (!nextPaymentDate) {
      toast.error("Por favor selecciona una fecha de pago");
      return;
    }

    // Obtener nombres legibles
    const macroName =
      reminderMacroCategories.find((m) => m.id === selectedMacro)?.name || "";
    const categoryName =
      categories.find((c) => c.id === selectedCategory)?.name || "";
    
    let businessName = "";
    if (selectedBusiness === "custom") {
      businessName = customBusiness.trim();
    } else {
      const found = businessTypes.find((b) => b.name === selectedBusiness);
      businessName = found ? found.name : selectedBusiness;
    }

    // Formatear fecha a formato YYYY-MM-DD para PostgreSQL
    const formattedDate = format(nextPaymentDate, "yyyy-MM-dd");

    // Preparar objeto - CLAVE: manejar correctamente null vs undefined
    const nuevoRecordatorio = {
      user_id: USER_ID,
      nombre: paymentName,
      macrocategoria: macroName,
      categoria: categoryName,
      negocio: businessName || null,
      monto: parseFloat(amount),
      fecha_proximo_pago: formattedDate,
      frecuencia: frequency,
      es_cuota: hasInstallments,
      cuota_actual: hasInstallments && totalInstallments ? parseInt(totalInstallments) : null,
    };

    console.log("📤 Enviando recordatorio:", nuevoRecordatorio);
    setIsSubmitting(true);

    try {
      const response = await fetch(
        "https://biyuyo-pruebas.onrender.com/reminders", 
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(nuevoRecordatorio),
        }
      );

      // Ver detalles del error si falla
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
        console.error("❌ Error del servidor:", errorData);
        throw new Error(errorData.error || "Error al guardar recordatorio");
      }

      const resultado = await response.json();
      console.log("✅ Recordatorio guardado:", resultado);

      toast.success("Recordatorio guardado exitosamente");
      
      // Limpiar formulario
      setSelectedMacro("");
      setSelectedCategory("");
      setSelectedBusiness("");
      setCustomBusiness("");
      setPaymentName("");
      setAmount("");
      setNextPaymentDate(undefined);
      setFrequency("");
      setHasInstallments(false);
      setTotalInstallments("");

      refreshTransactions();
      onSubmit();

    } catch (error) {
      console.error("❌ Error completo:", error);
      toast.error(error instanceof Error ? error.message : "Error conectando con la base de datos");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    selectedMacro &&
    selectedCategory &&
    selectedBusiness &&
    paymentName &&
    amount &&
    nextPaymentDate &&
    frequency &&
    (!hasInstallments || (hasInstallments && totalInstallments)) &&
    (selectedBusiness !== "custom" || customBusiness.trim() !== "");

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reminder-macro-category">Macro Categoría</Label>
        <Select value={selectedMacro} onValueChange={handleMacroChange}>
          <SelectTrigger id="reminder-macro-category" className="border-2">
            <SelectValue placeholder="Selecciona una macro categoría" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {reminderMacroCategories.map((macro) => (
              <SelectItem key={macro.id} value={macro.id}>
                {macro.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reminder-category">Categoría</Label>
        <Select
          value={selectedCategory}
          onValueChange={handleCategoryChange}
          disabled={!selectedMacro}
        >
          <SelectTrigger id="reminder-category" className="border-2">
            <SelectValue
              placeholder={
                selectedMacro
                  ? "Selecciona una categoría"
                  : "Primero selecciona una macro categoría"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reminder-business-type">Tipo de Negocio</Label>
        <Select
          value={selectedBusiness}
          onValueChange={handleBusinessChange}
          disabled={!selectedCategory}
        >
          <SelectTrigger id="reminder-business-type" className="border-2">
            <SelectValue
              placeholder={
                selectedCategory
                  ? "Selecciona un tipo de negocio"
                  : "Primero selecciona una categoría"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {businessTypes.map((business) => (
              <SelectItem key={business.id} value={business.name}>
                {business.name}
              </SelectItem>
            ))}
            <SelectItem value="custom">Otro (escribir manualmente)</SelectItem>
          </SelectContent>
        </Select>

        {selectedBusiness === "custom" && (
          <Input
            placeholder="Escribe el tipo de negocio"
            value={customBusiness}
            onChange={(e) => setCustomBusiness(e.target.value)}
            className="border-2 mt-2"
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment-name">Nombre del Pago</Label>
        <Input
          id="payment-name"
          type="text"
          placeholder="Ej: Netflix mensual, Alquiler apartamento..."
          value={paymentName}
          onChange={(e) => setPaymentName(e.target.value)}
          className="border-2"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reminder-amount">Monto del Pago</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
              {currency === "USD" ? "$" : "Bs."}
            </span>
            <Input
              id="reminder-amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-10 border-2"
              step="0.01"
              min="0"
            />
          </div>
          <CurrencySelector
            value={currency}
            onChange={setCurrency}
            className="w-28 border-2"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Fecha Próximo Pago</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal border-2",
                !nextPaymentDate && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {nextPaymentDate ? (
                format(nextPaymentDate, "PPP", { locale: es })
              ) : (
                <span>Selecciona una fecha</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={nextPaymentDate}
              onSelect={setNextPaymentDate}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="frequency">Frecuencia de Pago</Label>
        <Select
          value={frequency}
          onValueChange={(value) => setFrequency(value as PaymentFrequency)}
        >
          <SelectTrigger id="frequency" className="border-2">
            <SelectValue placeholder="Selecciona la frecuencia" />
          </SelectTrigger>
          <SelectContent>
            {paymentFrequencies.map((freq) => (
              <SelectItem key={freq.id} value={freq.id}>
                {freq.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="has-installments"
            checked={hasInstallments}
            onCheckedChange={(checked) => {
              setHasInstallments(checked === true);
              if (!checked) setTotalInstallments("");
            }}
          />
          <Label
            htmlFor="has-installments"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            ¿Es un pago en cuotas?
          </Label>
        </div>

        {hasInstallments && (
          <div className="space-y-2 pl-6">
            <Label htmlFor="total-installments">Cuotas totales</Label>
            <Input
              id="total-installments"
              type="number"
              placeholder="Ej: 12"
              value={totalInstallments}
              onChange={(e) => setTotalInstallments(e.target.value)}
              className="border-2"
              min="1"
            />
          </div>
        )}
      </div>

      <Button 
        className="w-full" 
        disabled={!isFormValid || isSubmitting} 
        onClick={handleSubmit}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Guardando Recordatorio...
          </>
        ) : (
          "Crear Recordatorio"
        )}
      </Button>
    </div>
  );
}
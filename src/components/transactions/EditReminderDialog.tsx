import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
} from "@/data/reminderCategories";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CurrencySelector, type Currency } from "./CurrencySelector";
import { useAuth } from "@/contexts/AuthContext";
import { editReminder } from "@/lib/editTransaction";
import { toast } from "sonner";
import { useExchangeRate } from "@/hooks/useExchangeRate";

interface EditReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reminder: {
    id: string;
    name: string;
    amount: number;
    macroCategory: string;
    category: string;
    business: string;
    nextDueDate: Date;
    frequency: string;
    isInstallment: boolean;
    currentInstallment?: number;
    totalInstallments?: number;
  };
  onEdited: () => void;
}

export function EditReminderDialog({
  open,
  onOpenChange,
  reminder,
  onEdited,
}: EditReminderDialogProps) {
  const { user } = useAuth();
  const { rate } = useExchangeRate();

  const [selectedMacro, setSelectedMacro] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState("");
  const [customBusiness, setCustomBusiness] = useState("");
  const [paymentName, setPaymentName] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [nextPaymentDate, setNextPaymentDate] = useState<Date | undefined>();
  const [frequency, setFrequency] = useState("");
  const [hasInstallments, setHasInstallments] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      const macroObj = reminderMacroCategories.find(
        (m) => m.name === reminder.macroCategory
      );
      const macroId = macroObj?.id || "";
      setSelectedMacro(macroId);

      const cats = macroId ? getReminderCategoriesByMacro(macroId) : [];
      const catObj = cats.find((c) => c.name === reminder.category);
      const catId = catObj?.id || "";
      setSelectedCategory(catId);

      if (macroId && catId) {
        const bizList = getReminderBusinessTypesByCategory(macroId, catId);
        const bizMatch = bizList.find((b) => b.name === reminder.business);
        if (bizMatch) {
          setSelectedBusiness(bizMatch.name);
          setCustomBusiness("");
        } else {
          setSelectedBusiness("custom");
          setCustomBusiness(reminder.business || "");
        }
      } else {
        setSelectedBusiness("custom");
        setCustomBusiness(reminder.business || "");
      }

      setPaymentName(reminder.name);
      setAmount(reminder.amount.toString());
      setCurrency("USD");
      setNextPaymentDate(new Date(reminder.nextDueDate));
      setFrequency(reminder.frequency);
      setHasInstallments(reminder.isInstallment);
      setTotalInstallments(
        reminder.totalInstallments ? reminder.totalInstallments.toString() : ""
      );
    }
  }, [open, reminder]);

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

  const categories = selectedMacro ? getReminderCategoriesByMacro(selectedMacro) : [];
  const businessTypes =
    selectedMacro && selectedCategory
      ? getReminderBusinessTypesByCategory(selectedMacro, selectedCategory)
      : [];

  const handleSubmit = async () => {
    if (!user || !nextPaymentDate) return;

    const macroObj = reminderMacroCategories.find((m) => m.id === selectedMacro);
    const macroName = macroObj?.name || "";

    const catObj = categories.find((c) => c.id === selectedCategory);
    const categoryName = catObj?.name || "";

    let businessName = "";
    if (selectedBusiness === "custom") {
      businessName = customBusiness.trim();
    } else {
      const found = businessTypes.find((b) => b.name === selectedBusiness);
      businessName = found ? found.name : selectedBusiness;
    }

    let finalAmount = parseFloat(amount);
    if (currency === "VES") {
      if (!rate || rate === 0) {
        toast.error("No se pudo obtener la tasa del BCV.");
        return;
      }
      finalAmount = finalAmount / rate;
    }

    const formattedDate = format(nextPaymentDate, "yyyy-MM-dd");

    setIsSubmitting(true);
    try {
      await editReminder(reminder.id, user.user_id, {
        reminder_name: paymentName,
        macrocategoria: macroName,
        categoria: categoryName,
        negocio: businessName,
        total_amount: finalAmount,
        next_payment_date: formattedDate,
        payment_frequency: frequency,
        is_installment: hasInstallments,
        installment_number:
          hasInstallments && totalInstallments ? parseInt(totalInstallments) : null,
      });
      toast.success("Recordatorio actualizado correctamente");
      onEdited();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al editar");
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
    (!hasInstallments || totalInstallments) &&
    (selectedBusiness !== "custom" || customBusiness.trim() !== "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto border-2">
        <DialogHeader>
          <DialogTitle>Editar Recordatorio</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Macro Categoría */}
          <div className="space-y-2">
            <Label>Macro Categoría</Label>
            <Select value={selectedMacro} onValueChange={handleMacroChange}>
              <SelectTrigger className="border-2">
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

          {/* Categoría */}
          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select
              value={selectedCategory}
              onValueChange={handleCategoryChange}
              disabled={!selectedMacro}
            >
              <SelectTrigger className="border-2">
                <SelectValue
                  placeholder={
                    selectedMacro
                      ? "Selecciona una categoría"
                      : "Primero selecciona una macro categoría"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Negocio */}
          <div className="space-y-2">
            <Label>Tipo de Negocio</Label>
            <Select
              value={selectedBusiness}
              onValueChange={(v) => {
                setSelectedBusiness(v);
                if (v !== "custom") setCustomBusiness("");
              }}
              disabled={!selectedCategory}
            >
              <SelectTrigger className="border-2">
                <SelectValue
                  placeholder={
                    selectedCategory
                      ? "Selecciona un tipo"
                      : "Primero selecciona una categoría"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {businessTypes.map((biz) => (
                  <SelectItem key={biz.id} value={biz.name}>
                    {biz.name}
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

          {/* Nombre del Pago */}
          <div className="space-y-2">
            <Label>Nombre del Pago</Label>
            <Input
              type="text"
              placeholder="Ej: Netflix mensual"
              value={paymentName}
              onChange={(e) => setPaymentName(e.target.value)}
              className="border-2"
            />
          </div>

          {/* Monto */}
          <div className="space-y-2">
            <Label>Monto</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  {currency === "USD" ? "$" : "Bs."}
                </span>
                <Input
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
            {currency === "VES" && rate && amount && (
              <p className="text-xs text-muted-foreground ml-1">
                Se guardará como:{" "}
                <span className="font-semibold text-primary">
                  ${(parseFloat(amount) / rate).toFixed(2)} USD
                </span>{" "}
                (Tasa BCV: {rate})
              </p>
            )}
          </div>

          {/* Fecha */}
          <div className="space-y-2">
            <Label>Fecha Próximo Pago</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal border-2",
                    !nextPaymentDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {nextPaymentDate
                    ? format(nextPaymentDate, "PPP", { locale: es })
                    : "Selecciona una fecha"}
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

          {/* Frecuencia */}
          <div className="space-y-2">
            <Label>Frecuencia de Pago</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger className="border-2">
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

          {/* Cuotas */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-has-installments"
                checked={hasInstallments}
                onCheckedChange={(checked) => {
                  setHasInstallments(checked === true);
                  if (!checked) setTotalInstallments("");
                }}
              />
              <Label htmlFor="edit-has-installments" className="text-sm font-medium">
                ¿Es un pago en cuotas?
              </Label>
            </div>
            {hasInstallments && (
              <div className="space-y-2 pl-6">
                <Label>Cuotas totales</Label>
                <Input
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

          {/* Botones */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  macroCategories,
  getCategoriesByMacro,
  getBusinessTypesByCategory,
} from "@/data/categories";
import {
  incomeMacroCategories,
  getIncomeCategoriesByMacro,
  getIncomeBusinessTypesByCategory,
} from "@/data/incomeCategories";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { editExpense, editIncome } from "@/lib/editTransaction";
import { toast } from "sonner";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { CurrencySelector, type Currency } from "./CurrencySelector";

interface EditTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: {
    id: string;
    type: "expense" | "income";
    amount: number;
    macroCategory: string;
    category: string;
    business: string;
  };
  onEdited: () => void;
}

export function EditTransactionDialog({
  open,
  onOpenChange,
  transaction,
  onEdited,
}: EditTransactionDialogProps) {
  const { user } = useAuth();
  const { rate } = useExchangeRate();

  const isExpense = transaction.type === "expense";
  const macros = isExpense ? macroCategories : incomeMacroCategories;
  const getCats = isExpense ? getCategoriesByMacro : getIncomeCategoriesByMacro;
  const getBiz = isExpense ? getBusinessTypesByCategory : getIncomeBusinessTypesByCategory;

  const [selectedMacro, setSelectedMacro] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState("");
  const [customBusiness, setCustomBusiness] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill fields when dialog opens
  useEffect(() => {
    if (open) {
      // Find macro id from name
      const macroObj = macros.find((m) => m.name === transaction.macroCategory);
      const macroId = macroObj?.id || "";
      setSelectedMacro(macroId);

      // Find category id from name
      const cats = macroId ? getCats(macroId) : [];
      const catObj = cats.find((c) => c.name === transaction.category);
      const catId = catObj?.id || "";
      setSelectedCategory(catId);

      // Find business or set as custom
      if (macroId && catId) {
        const bizList = getBiz(macroId, catId);
        const bizMatch = bizList.find((b) => b.name === transaction.business);
        if (bizMatch) {
          setSelectedBusiness(bizMatch.name);
          setCustomBusiness("");
        } else {
          setSelectedBusiness("custom");
          setCustomBusiness(transaction.business);
        }
      } else {
        setSelectedBusiness("custom");
        setCustomBusiness(transaction.business);
      }

      setAmount(transaction.amount.toString());
      setCurrency("USD");
    }
  }, [open, transaction]);

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

  const categories = selectedMacro ? getCats(selectedMacro) : [];
  const businessTypes =
    selectedMacro && selectedCategory ? getBiz(selectedMacro, selectedCategory) : [];

  const handleSubmit = async () => {
    if (!user) return;

    const macroObj = macros.find((m) => m.id === selectedMacro);
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

    setIsSubmitting(true);
    try {
      if (isExpense) {
        await editExpense(transaction.id, user.user_id, {
          macrocategoria: macroName,
          categoria: categoryName,
          negocio: businessName,
          total_amount: finalAmount,
        });
      } else {
        await editIncome(transaction.id, user.user_id, {
          macrocategoria: macroName,
          categoria: categoryName,
          negocio: businessName,
          total_amount: finalAmount,
        });
      }
      toast.success(`${isExpense ? "Gasto" : "Ingreso"} actualizado correctamente`);
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
    amount &&
    (selectedBusiness !== "custom" || customBusiness.trim() !== "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto border-2">
        <DialogHeader>
          <DialogTitle>
            Editar {isExpense ? "Gasto" : "Ingreso"}
          </DialogTitle>
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
                {macros.map((macro) => (
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
            <Label>{isExpense ? "Tipo de Negocio" : "Tipo de Fuente"}</Label>
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
                placeholder="Escribe el tipo"
                value={customBusiness}
                onChange={(e) => setCustomBusiness(e.target.value)}
                className="border-2 mt-2"
              />
            )}
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
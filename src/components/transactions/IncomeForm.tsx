import { useState, useRef } from "react";
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
  incomeMacroCategories,
  getIncomeCategoriesByMacro,
  getIncomeBusinessTypesByCategory,
  type Category,
  type BusinessType,
} from "@/data/incomeCategories";
import { Camera, X, Loader2 } from "lucide-react";
import { CurrencySelector, type Currency } from "./CurrencySelector";
import { toast } from "sonner";
import { useTransactions } from "@/hooks/useTransactions";
import { useAuth } from "@/contexts/AuthContext";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { triggerMLTraining } from "@/lib/ml";

interface IncomeFormProps {
  onSubmit: () => void;
}

export function IncomeForm({ onSubmit }: IncomeFormProps) {
  const { user } = useAuth();
  const { refreshTransactions } = useTransactions(user?.user_id || "");
  const { rate, loading: loadingRate } = useExchangeRate();

  const [selectedMacro, setSelectedMacro] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedBusiness, setSelectedBusiness] = useState<string>("");
  const [customBusiness, setCustomBusiness] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories: Category[] = selectedMacro
    ? getIncomeCategoriesByMacro(selectedMacro)
    : [];
  const businessTypes: BusinessType[] =
    selectedMacro && selectedCategory
      ? getIncomeBusinessTypesByCategory(selectedMacro, selectedCategory)
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setReceiptImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Debes iniciar sesión para registrar un ingreso");
      return;
    }

    const macroName =
      incomeMacroCategories.find((m) => m.id === selectedMacro)?.name || "";
    const categoryName =
      categories.find((c) => c.id === selectedCategory)?.name || "";

    let businessName = "";
    if (selectedBusiness === "custom") {
      businessName = customBusiness.trim();
    } else {
      const found = businessTypes.find((b) => b.name === selectedBusiness);
      businessName = found ? found.name : selectedBusiness;
    }

    // --- LÓGICA DE CONVERSIÓN DE MONEDA ---
    let finalAmountUSD = parseFloat(amount);

    if (currency === "VES") {
      if (!rate || rate === 0) {
        toast.error(
          "No se pudo obtener la tasa del BCV para realizar la conversión.",
        );
        return;
      }
      // Dividimos los Bolívares entre la tasa para obtener Dólares
      finalAmountUSD = finalAmountUSD / rate;
    }
    // --------------------------------------

    const nuevoIngreso = {
      macrocategoria: macroName,
      categoria: categoryName,
      negocio: businessName,
      total_amount: finalAmountUSD, // Siempre enviamos el monto en USD
      user_id: user.user_id, // Usar el ID del usuario autenticado
    };

    setIsSubmitting(true);

    try {
      const response = await fetch(
        "https://biyuyo-pruebas.onrender.com/incomes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(nuevoIngreso),
        },
      );

      if (!response.ok) {
        throw new Error("Error al guardar en el servidor");
      }

      toast.success("Ingreso registrado exitosamente");

      refreshTransactions();

      // Disparar entrenamiento automático de IA en segundo plano
      triggerMLTraining(user.user_id);

      // Resetear formulario
      setSelectedMacro("");
      setSelectedCategory("");
      setSelectedBusiness("");
      setCustomBusiness("");
      setAmount("");
      setReceiptImage(null);

      onSubmit();
    } catch (error) {
      console.error(error);
      toast.error("Error conectando con la base de datos");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validamos el formulario. Si es VES, requerimos que la tasa (rate) exista.
  const isFormValid =
    selectedMacro &&
    selectedCategory &&
    selectedBusiness &&
    amount &&
    (currency !== "VES" || (rate && !loadingRate)) &&
    (selectedBusiness !== "custom" || customBusiness.trim() !== "");

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="income-macro-category">Macro Categoría</Label>
        <Select value={selectedMacro} onValueChange={handleMacroChange}>
          <SelectTrigger id="income-macro-category" className="border-2">
            <SelectValue placeholder="Selecciona una macro categoría" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {incomeMacroCategories.map((macro) => (
              <SelectItem key={macro.id} value={macro.id}>
                {macro.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="income-category">Categoría</Label>
        <Select
          value={selectedCategory}
          onValueChange={handleCategoryChange}
          disabled={!selectedMacro}
        >
          <SelectTrigger id="income-category" className="border-2">
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
        <Label htmlFor="income-business-type">Tipo de Fuente</Label>
        <Select
          value={selectedBusiness}
          onValueChange={handleBusinessChange}
          disabled={!selectedCategory}
        >
          <SelectTrigger id="income-business-type" className="border-2">
            <SelectValue
              placeholder={
                selectedCategory
                  ? "Selecciona un tipo de fuente"
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
            placeholder="Escribe el tipo de fuente"
            value={customBusiness}
            onChange={(e) => setCustomBusiness(e.target.value)}
            className="border-2 mt-2"
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="income-amount">Monto</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
              {currency === "USD" ? "$" : "Bs."}
            </span>
            <Input
              id="income-amount"
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

        {/* Helper text para mostrar la conversión en tiempo real */}
        {currency === "VES" && rate && amount && (
          <div className="text-xs text-muted-foreground mt-1 ml-1">
            Se guardará como:{" "}
            <span className="font-semibold text-primary">
              ${(parseFloat(amount) / rate).toFixed(2)} USD
            </span>{" "}
            (Tasa BCV: {rate})
          </div>
        )}
      </div>

      <Button
        className="w-full"
        disabled={!isFormValid || isSubmitting || !user}
        onClick={handleSubmit}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Guardando...
          </>
        ) : (
          "Registrar Ingreso"
        )}
      </Button>
    </div>
  );
}
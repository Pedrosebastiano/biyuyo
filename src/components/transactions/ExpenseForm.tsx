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
  macroCategories,
  getCategoriesByMacro,
  getBusinessTypesByCategory,
  type Category,
  type BusinessType,
} from "@/data/categories";
import { Camera, X } from "lucide-react";
import { CurrencySelector, type Currency } from "./CurrencySelector";
import { useTransactions } from "@/hooks/useTransactions";
import { toast } from "sonner";

interface ExpenseFormProps {
  onSubmit: () => void;
}

export function ExpenseForm({ onSubmit }: ExpenseFormProps) {
  const { addTransaction } = useTransactions();
  const [selectedMacro, setSelectedMacro] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedBusiness, setSelectedBusiness] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories: Category[] = selectedMacro
    ? getCategoriesByMacro(selectedMacro)
    : [];
  const businessTypes: BusinessType[] =
    selectedMacro && selectedCategory
      ? getBusinessTypesByCategory(selectedMacro, selectedCategory)
      : [];

  const handleMacroChange = (value: string) => {
    setSelectedMacro(value);
    setSelectedCategory("");
    setSelectedBusiness("");
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setSelectedBusiness("");
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

  const handleSubmit = () => {
    const macroName =
      macroCategories.find((m) => m.id === selectedMacro)?.name || "";
    const categoryName =
      categories.find((c) => c.id === selectedCategory)?.name || "";
    const businessName =
      selectedBusiness === "custom"
        ? selectedBusiness
        : businessTypes.find((b) => b.name === selectedBusiness)?.name ||
          selectedBusiness;

    addTransaction({
      type: "expense",
      macroCategory: macroName,
      category: categoryName,
      business: businessName,
      amount: parseFloat(amount),
      currency,
      receiptImage: receiptImage || undefined,
    });

    toast.success("Gasto registrado exitosamente");
    onSubmit();
  };

  const isFormValid =
    selectedMacro && selectedCategory && selectedBusiness && amount;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="expense-macro-category">Macro Categoría</Label>
        <Select value={selectedMacro} onValueChange={handleMacroChange}>
          <SelectTrigger id="expense-macro-category" className="border-2">
            <SelectValue placeholder="Selecciona una macro categoría" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {macroCategories.map((macro) => (
              <SelectItem key={macro.id} value={macro.id}>
                {macro.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="expense-category">Categoría</Label>
        <Select
          value={selectedCategory}
          onValueChange={handleCategoryChange}
          disabled={!selectedMacro}
        >
          <SelectTrigger id="expense-category" className="border-2">
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
        <Label htmlFor="expense-business-type">Tipo de Negocio</Label>
        <Select
          value={selectedBusiness}
          onValueChange={setSelectedBusiness}
          disabled={!selectedCategory}
        >
          <SelectTrigger id="expense-business-type" className="border-2">
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
            value=""
            onChange={(e) => setSelectedBusiness(e.target.value || "custom")}
            className="border-2 mt-2"
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="expense-amount">Monto</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
              {currency === "USD" ? "$" : "Bs."}
            </span>
            <Input
              id="expense-amount"
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
        <Label>Foto de Factura (Opcional)</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageUpload}
          className="hidden"
        />

        {receiptImage ? (
          <div className="relative rounded-lg border-2 border-border overflow-hidden">
            <img
              src={receiptImage}
              alt="Factura"
              className="w-full h-40 object-cover"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={removeImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full h-24 border-2 border-dashed flex flex-col gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Tomar foto o subir imagen
            </span>
          </Button>
        )}
      </div>

      <Button className="w-full" disabled={!isFormValid} onClick={handleSubmit}>
        Registrar Gasto
      </Button>
    </div>
  );
}

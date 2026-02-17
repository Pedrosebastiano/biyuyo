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
import { Camera, X, Loader2 } from "lucide-react";
import { CurrencySelector, type Currency } from "./CurrencySelector";
import { useTransactions } from "@/hooks/useTransactions";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { triggerMLTraining } from "@/lib/ml";

// Configuración de Supabase
const supabaseUrl = "https://pmjjguyibxydzxnofcjx.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtampndXlpYnh5ZHp4bm9mY2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwODE2NTAsImV4cCI6MjA4NTY1NzY1MH0.ZYTzwvzdcjgiiJHollA7vyNZ7ZF8hIN1NuTOq5TdtjI";
const supabase = createClient(supabaseUrl, supabaseKey);

interface ExpenseFormProps {
  onSubmit: () => void;
}

export function ExpenseForm({ onSubmit }: ExpenseFormProps) {
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
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      // Validar que sea una imagen
      if (!file.type.match("image.*")) {
        toast.error("Solo se permiten archivos de imagen");
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La imagen no debe superar los 5MB");
        return;
      }

      setReceiptFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setReceiptImage(null);
    setReceiptFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImageToSupabase = async (file: File): Promise<string | null> => {
    try {
      // Generar nombre único para el archivo
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `imagenes/${fileName}`;

      console.log(`📤 Subiendo imagen a Supabase: ${filePath}`);

      // Subir el archivo a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("factura")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        console.error("❌ Error subiendo imagen:", uploadError);
        throw uploadError;
      }

      // Obtener URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from("factura").getPublicUrl(filePath);

      console.log(`✅ Imagen subida exitosamente: ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      console.error("Error completo al subir imagen:", error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Debes iniciar sesión para registrar un gasto");
      return;
    }

    const macroName =
      macroCategories.find((m) => m.id === selectedMacro)?.name || "";
    const categoryName =
      categories.find((c) => c.id === selectedCategory)?.name || "";

    // Determinar el nombre del negocio
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

    setIsSubmitting(true);

    try {
      let imageUrl: string | null = null;

      // Subir imagen si existe
      if (receiptFile) {
        console.log("📷 Procesando imagen de factura...");
        imageUrl = await uploadImageToSupabase(receiptFile);

        if (!imageUrl) {
          toast.error(
            "Error al subir la imagen, pero el gasto se guardará sin ella",
          );
        }
      }

      // Preparar objeto del gasto
      const nuevoGasto = {
        macrocategoria: macroName,
        categoria: categoryName,
        negocio: businessName,
        total_amount: finalAmountUSD, // Siempre enviamos USD
        user_id: user.user_id, // Usar el ID del usuario autenticado
        receipt_image_url: imageUrl, // Agregar URL de la imagen
      };

      console.log("📤 Enviando gasto a la base de datos:", nuevoGasto);

      const response = await fetch(
        "https://biyuyo-pruebas.onrender.com/expenses",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(nuevoGasto),
        },
      );

      if (!response.ok) {
        throw new Error("Error al guardar gasto en el servidor");
      }

      // ÉXITO - Mensaje personalizado
      let successMsg = "Gasto registrado exitosamente";
      if (imageUrl) successMsg += " con imagen.";

      toast.success(successMsg);

      // Refrescar lista
      refreshTransactions();

      // Disparar entrenamiento automático de IA en segundo plano
      triggerMLTraining(user.user_id);

      // Limpiar
      setSelectedMacro("");
      setSelectedCategory("");
      setSelectedBusiness("");
      setCustomBusiness("");
      setAmount("");
      setReceiptImage(null);
      setReceiptFile(null);

      // Cerrar
      onSubmit();
    } catch (error) {
      console.error(error);
      toast.error("Error conectando con la base de datos");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    selectedMacro &&
    selectedCategory &&
    selectedBusiness &&
    amount &&
    (currency !== "VES" || (rate && !loadingRate)) && // Validar tasa
    (selectedBusiness !== "custom" || customBusiness.trim() !== "");

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
          onValueChange={handleBusinessChange}
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
            value={customBusiness}
            onChange={(e) => setCustomBusiness(e.target.value)}
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
          "Registrar Gasto"
        )}
      </Button>
    </div>
  );
}
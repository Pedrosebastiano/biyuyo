import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  type BusinessType 
} from "@/data/categories";
import { TrendingDown, TrendingUp, Bell, Camera, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTransactionDialog({ open, onOpenChange }: AddTransactionDialogProps) {
  const [activeTab, setActiveTab] = useState("expense");
  
  // Expense form state
  const [selectedMacro, setSelectedMacro] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedBusiness, setSelectedBusiness] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get filtered options based on selections
  const categories: Category[] = selectedMacro ? getCategoriesByMacro(selectedMacro) : [];
  const businessTypes: BusinessType[] = selectedMacro && selectedCategory 
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

  const handleSubmitExpense = () => {
    // TODO: Implement expense submission
    console.log({
      type: "expense",
      macroCategory: selectedMacro,
      category: selectedCategory,
      businessType: selectedBusiness,
      amount: parseFloat(amount),
      receiptImage,
    });
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setSelectedMacro("");
    setSelectedCategory("");
    setSelectedBusiness("");
    setAmount("");
    setReceiptImage(null);
  };

  const isExpenseFormValid = selectedMacro && selectedCategory && selectedBusiness && amount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-2">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Nueva Transacción</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="expense" className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              <span className="hidden sm:inline">Gasto</span>
            </TabsTrigger>
            <TabsTrigger value="income" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Ingreso</span>
            </TabsTrigger>
            <TabsTrigger value="reminder" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Recordatorio</span>
            </TabsTrigger>
          </TabsList>

          {/* Expense Tab */}
          <TabsContent value="expense" className="space-y-4">
            {/* Macro Category */}
            <div className="space-y-2">
              <Label htmlFor="macro-category">Macro Categoría</Label>
              <Select value={selectedMacro} onValueChange={handleMacroChange}>
                <SelectTrigger id="macro-category" className="border-2">
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

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select 
                value={selectedCategory} 
                onValueChange={handleCategoryChange}
                disabled={!selectedMacro}
              >
                <SelectTrigger id="category" className="border-2">
                  <SelectValue placeholder={selectedMacro ? "Selecciona una categoría" : "Primero selecciona una macro categoría"} />
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

            {/* Business Type */}
            <div className="space-y-2">
              <Label htmlFor="business-type">Tipo de Negocio</Label>
              <Select 
                value={selectedBusiness} 
                onValueChange={setSelectedBusiness}
                disabled={!selectedCategory}
              >
                <SelectTrigger id="business-type" className="border-2">
                  <SelectValue placeholder={selectedCategory ? "Selecciona un tipo de negocio" : "Primero selecciona una categoría"} />
                </SelectTrigger>
                <SelectContent>
                  {businessTypes.map((business) => (
                    <SelectItem key={business.id} value={business.id}>
                      {business.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8 border-2"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            {/* Receipt Image Upload */}
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

            {/* Submit Button */}
            <Button 
              className="w-full" 
              disabled={!isExpenseFormValid}
              onClick={handleSubmitExpense}
            >
              Registrar Gasto
            </Button>
          </TabsContent>

          {/* Income Tab */}
          <TabsContent value="income" className="space-y-4">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-primary/10 mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Registrar Ingreso</h3>
              <p className="text-muted-foreground text-sm max-w-xs">
                Próximamente podrás registrar tus ingresos con categorías personalizadas.
              </p>
            </div>
          </TabsContent>

          {/* Reminder Tab */}
          <TabsContent value="reminder" className="space-y-4">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-primary/10 mb-4">
                <Bell className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Crear Recordatorio</h3>
              <p className="text-muted-foreground text-sm max-w-xs">
                Próximamente podrás crear recordatorios de pagos y compromisos financieros.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

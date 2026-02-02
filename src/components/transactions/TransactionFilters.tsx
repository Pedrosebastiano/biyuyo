import { useState } from "react";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SlidersHorizontal, CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface FilterState {
  category: string;
  minAmount: string;
  maxAmount: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

interface TransactionFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  categories: string[];
  showDueDateSort?: boolean;
}

export function TransactionFilters({
  filters,
  onFiltersChange,
  categories,
  showDueDateSort = false,
}: TransactionFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      category: "",
      minAmount: "",
      maxAmount: "",
      startDate: undefined,
      endDate: undefined,
      sortBy: "date",
      sortOrder: "desc",
    });
  };

  const hasActiveFilters =
    filters.category ||
    filters.minAmount ||
    filters.maxAmount ||
    filters.startDate ||
    filters.endDate;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {hasActiveFilters && (
            <span className="h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle>Filtros y Ordenamiento</SheetTitle>
          <SheetDescription>
            Filtra y ordena tus transacciones
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Category Filter */}
          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select
              value={filters.category}
              onValueChange={(value) => updateFilter("category", value)}
            >
              <SelectTrigger className="border-2">
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las categorías</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount Range */}
          <div className="space-y-2">
            <Label>Rango de monto</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Mínimo"
                value={filters.minAmount}
                onChange={(e) => updateFilter("minAmount", e.target.value)}
                className="border-2"
              />
              <Input
                type="number"
                placeholder="Máximo"
                value={filters.maxAmount}
                onChange={(e) => updateFilter("maxAmount", e.target.value)}
                className="border-2"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label>Rango de fecha</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal border-2",
                      !filters.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.startDate
                      ? format(filters.startDate, "dd/MM/yy", { locale: es })
                      : "Desde"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.startDate}
                    onSelect={(date) => updateFilter("startDate", date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal border-2",
                      !filters.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.endDate
                      ? format(filters.endDate, "dd/MM/yy", { locale: es })
                      : "Hasta"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.endDate}
                    onSelect={(date) => updateFilter("endDate", date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Sort Options */}
          <div className="space-y-2">
            <Label>Ordenar por</Label>
            <div className="flex gap-2">
              <Select
                value={filters.sortBy}
                onValueChange={(value) => updateFilter("sortBy", value)}
              >
                <SelectTrigger className="flex-1 border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Fecha</SelectItem>
                  <SelectItem value="amount">Monto</SelectItem>
                  <SelectItem value="category">Categoría</SelectItem>
                  {showDueDateSort && (
                    <SelectItem value="dueDate">Próximo vencimiento</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Select
                value={filters.sortOrder}
                onValueChange={(value) =>
                  updateFilter("sortOrder", value as "asc" | "desc")
                }
              >
                <SelectTrigger className="w-32 border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Mayor a menor</SelectItem>
                  <SelectItem value="asc">Menor a mayor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1 border-2"
              onClick={clearFilters}
            >
              <X className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
            <Button className="flex-1" onClick={() => setIsOpen(false)}>
              Aplicar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

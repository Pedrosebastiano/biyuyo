import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, DollarSign, Rocket, Star, Heart, Briefcase, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { getApiUrl } from "@/lib/config";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

import { DatePicker } from "@/components/ui/date-picker";

const API_URL = getApiUrl();

interface AddGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  sharedId?: string;
}

const icons = [
  { id: "target", icon: Target, label: "General" },
  { id: "travel", icon: Rocket, label: "Viaje" },
  { id: "savings", icon: Star, label: "Ahorro" },
  { id: "personal", icon: Heart, label: "Personal" },
  { id: "work", icon: Briefcase, label: "Negocio" },
];

export function AddGoalDialog({ open, onOpenChange, onSuccess, sharedId }: AddGoalDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState("target");
  const [date, setDate] = useState<Date | undefined>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !date) {
      if (!date) toast.error("Por favor selecciona una fecha límite");
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget as HTMLFormElement);

    const goalData = {
      user_id: user.user_id,
      title: formData.get("title"),
      target_amount: parseFloat(formData.get("target_amount") as string),
      current_amount: parseFloat(formData.get("current_amount") as string) || 0,
      deadline: date.toISOString().split('T')[0], // yyyy-mm-dd
      icon: selectedIcon,
      shared_id: sharedId || null,
    };

    try {
      const response = await fetch(`${API_URL}/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goalData),
      });

      if (response.ok) {
        toast.success("¡Meta creada con éxito!");
        onSuccess?.();
        onOpenChange(false);
        setDate(undefined); // Reset state
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error saving goal:", error);
      toast.error("Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-3xl gap-6" data-onboarding="goal-dialog-content">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#2d509e] flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Nueva Meta
          </DialogTitle>
          <DialogDescription>
            Define tu próximo gran objetivo financiero.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selector de Icono Estético */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Elige un estilo</Label>
            <div className="flex justify-between gap-2">
              {icons.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedIcon(item.id)}
                  className={cn(
                    "flex-1 py-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1",
                    selectedIcon === item.id
                      ? "border-primary bg-primary/5 text-primary scale-105"
                      : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  <item.icon size={20} />
                  <span className="text-[10px] font-semibold">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Inputs Principales */}
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">¿Qué quieres lograr?</Label>
              <Input
                id="title"
                name="title"
                placeholder="Ej. Viaje a la playa"
                className="rounded-xl border-muted-foreground/20 focus-visible:ring-primary h-12"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target_amount">Monto Meta</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="target_amount"
                    name="target_amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-9 rounded-xl h-12"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="current_amount">Ahorro Inicial</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="current_amount"
                    name="current_amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-9 rounded-xl h-12"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Fecha Límite</Label>
              <DatePicker
                date={date}
                setDate={setDate}
                placeholder="Selecciona una fecha"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="submit"
              className="w-full h-12 rounded-2xl text-base font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? "Creando..." : "¡Empezar a ahorrar!"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getApiUrl } from "@/lib/config";

const API_URL = getApiUrl();

interface FeedbackButtonsProps {
  expenseId: string;         // Ej: "exp-123" o el UUID directo
  userId: string;
  initialFeedback?: number | null;
  onFeedbackSaved?: (feedback: number) => void;
}

const FEEDBACK_OPTIONS = [
  { value: 1,  emoji: "😊", label: "Buena decisión",  activeClass: "bg-emerald-100 border-emerald-500 text-emerald-700" },
  { value: 0,  emoji: "😐", label: "Neutral",          activeClass: "bg-yellow-100 border-yellow-500 text-yellow-700" },
  { value: -1, emoji: "😰", label: "Me arrepentí",     activeClass: "bg-red-100 border-red-500 text-red-700" },
];

export function FeedbackButtons({ 
  expenseId, 
  userId, 
  initialFeedback = null,
  onFeedbackSaved 
}: FeedbackButtonsProps) {
  const [selected, setSelected] = useState<number | null>(initialFeedback ?? null);
  const [isSaving, setIsSaving] = useState(false);

  // El expenseId viene como "exp-123uuid" desde useTransactions
  // Necesitamos solo el UUID puro
  const rawId = expenseId.startsWith("exp-") 
    ? expenseId.replace("exp-", "") 
    : expenseId;

  const handleFeedback = async (value: number) => {
    // Si ya está seleccionado, no hacer nada
    if (selected === value || isSaving) return;

    setIsSaving(true);
    const previousSelected = selected;
    setSelected(value); // Optimistic update

    try {
      const response = await fetch(`${API_URL}/expenses/${rawId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, feedback: value }),
      });

      if (!response.ok) {
        throw new Error("Error al guardar feedback");
      }

      const option = FEEDBACK_OPTIONS.find(o => o.value === value);
      toast.success(`Feedback guardado: ${option?.label}`);
      onFeedbackSaved?.(value);

    } catch (error) {
      setSelected(previousSelected); // Revertir si falla
      toast.error("No se pudo guardar el feedback");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
        ¿Fue buena decisión?
      </p>
      <div className="flex gap-1.5">
        {FEEDBACK_OPTIONS.map((option) => {
          const isSelected = selected === option.value;
          return (
            <button
              key={option.value}
              onClick={() => handleFeedback(option.value)}
              disabled={isSaving}
              title={option.label}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-lg border-2 text-xs font-medium",
                "transition-all duration-200",
                "hover:scale-105 active:scale-95",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                isSelected
                  ? option.activeClass
                  : "border-border bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              <span className="text-sm">{option.emoji}</span>
              {isSelected && (
                <span className="hidden sm:inline text-[10px]">
                  {option.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
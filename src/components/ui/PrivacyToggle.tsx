/**
 * PrivacyToggle.tsx
 *
 * Botón sutil Eye / EyeOff para activar/desactivar el Modo Privacidad.
 * Diseño consistente con el sistema de botones existente de Biyuyo.
 */

import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { cn } from "@/lib/utils";

interface PrivacyToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function PrivacyToggle({ className, showLabel = false }: PrivacyToggleProps) {
  const { isPrivacyMode, isLoading, togglePrivacyMode } = usePrivacy();

  return (
    <Button
      variant="outline"
      size={showLabel ? "default" : "icon"}
      onClick={togglePrivacyMode}
      disabled={isLoading}
      aria-label={
        isPrivacyMode
          ? "Mostrar valores financieros"
          : "Ocultar valores financieros"
      }
      title={
        isPrivacyMode
          ? "Modo privacidad activo — clic para mostrar valores"
          : "Activar modo privacidad"
      }
      className={cn(
        "relative border-2 transition-all duration-150",
        isPrivacyMode
          ? "border-primary/50 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/70"
          : "border-border text-muted-foreground hover:text-foreground hover:border-primary/30",
        showLabel && "gap-2",
        className
      )}
    >
      {isPrivacyMode ? (
        <EyeOff className="h-4 w-4 shrink-0" />
      ) : (
        <Eye className="h-4 w-4 shrink-0" />
      )}

      {showLabel && (
        <span className="text-sm font-medium">
          {isPrivacyMode ? "Privacidad ON" : "Privacidad"}
        </span>
      )}

    
    </Button>
  );
}
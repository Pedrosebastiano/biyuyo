import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
// 1. Importa el hook (ajusta la ruta según tu proyecto)
import { useExchangeRate } from "../../hooks/useExchangeRate"; 

export function MobileHeader() {
  // 2. Extraemos 'rate' y 'loading' del hook
  const { rate, loading } = useExchangeRate();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-14 bg-card border-b-2 border-border px-4 flex items-center justify-between transition-transform duration-300 lg:hidden",
        !isVisible && "-translate-y-full"
      )}
    >
      {/* Profile */}
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 border-2 border-border">
          <AvatarImage 
            src="https://pmjjguyibxydzxnofcjx.supabase.co/storage/v1/object/public/factura/biyuyo_imagen.png" 
            alt="Biyuyo Logo" 
          />
          <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
            BY
          </AvatarFallback>
        </Avatar>
        <span className="font-semibold text-sm">Biyuyo</span>
      </div>

      {/* Exchange Rate */}
      <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg">
        <span className="text-xs text-muted-foreground uppercase">BCV</span>
        <span className="font-mono font-bold text-sm text-primary">
          {/* 3. Lógica para mostrar el precio o un estado de carga */}
          {loading ? (
            <span className="animate-pulse opacity-50">...</span>
          ) : (
            `Bs. ${rate?.toLocaleString("es-VE", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
          )}
        </span>
      </div>
    </header>
  );
}
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useExchangeRate } from "../../hooks/useExchangeRate";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import biyuyoLogo from "@/assets/biyuyo-logo.png";

export function MobileHeader() {
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
        "fixed top-0 left-0 right-0 z-50 h-14 bg-card border-b-2 border-border px-3 flex items-center justify-between transition-transform duration-300 lg:hidden",
        !isVisible && "-translate-y-full"
      )}
    >
      {/* Profile with Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1.5 focus:outline-none">
            <Avatar className="h-8 w-8 border-2 border-border">
              <AvatarImage src="/placeholder.svg" alt="User" />
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs">
                JD
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-xs">John Doe</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48 border-2">
          <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Perfil</DropdownMenuItem>
          <DropdownMenuItem>Facturación</DropdownMenuItem>
          <DropdownMenuItem>Configuración</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive">Cerrar sesión</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Center Logo */}
      <Link to="/" className="absolute left-1/2 -translate-x-1/2">
        <img src={biyuyoLogo} alt="Biyuyo" className="h-9 w-auto" />
      </Link>

      {/* Exchange Rate */}
      <div className="flex items-center bg-muted px-2 py-1 rounded-md">
        <span className="font-mono font-semibold text-xs text-primary">
          {loading ? (
            <span className="animate-pulse opacity-50">...</span>
          ) : (
            `$1 ⇄ Bs. ${rate?.toLocaleString("es-VE", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
          )}
        </span>
      </div>
    </header>
  );
}
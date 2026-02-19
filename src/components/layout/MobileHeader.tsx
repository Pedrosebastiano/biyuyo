import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useExchangeRate } from "../../hooks/useExchangeRate";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import biyuyoLogo from "@/assets/biyuyo-logo.png";
import { CurrencyConverterDialog } from "@/components/ui/CurrencyConverterDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useSharedProfile } from "@/contexts/SharedProfileContext";

export function MobileHeader() {
  const { rate, rateDate, loading } = useExchangeRate();
  const { user, logout } = useAuth();
  const { activeSharedProfile } = useSharedProfile();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isConverterOpen, setIsConverterOpen] = useState(false);

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start">
              <span className="font-medium text-xs">{user?.name || "Usuario"}</span>
              {activeSharedProfile && (
                <span className="text-[10px] text-primary font-medium leading-tight">
                  📋 {activeSharedProfile.name}
                </span>
              )}
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48 border-2">
          <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/profile")}>Perfil</DropdownMenuItem>
          <DropdownMenuItem>Configuración</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={handleLogout}>Cerrar sesión</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Center Logo */}
      <Link to="/" className="absolute left-1/2 -translate-x-1/2">
        <img src={biyuyoLogo} alt="Biyuyo" className="h-9 w-auto" />
      </Link>

      {/* Exchange Rate */}
      <button
        onClick={() => setIsConverterOpen(true)}
        className="flex items-center bg-muted px-2 py-1 rounded-md hover:bg-muted/80 transition-colors"
      >
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
      </button>

      <CurrencyConverterDialog
        open={isConverterOpen}
        onOpenChange={setIsConverterOpen}
        exchangeRate={rate}
        rateDate={rateDate}
      />
    </header>
  );
}
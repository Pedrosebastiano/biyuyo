import { useLocation, useNavigate } from "react-router-dom";
// Añadimos 'Target' a las importaciones de lucide
import { LayoutDashboard, Wallet, TrendingUp, Sparkles, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Wallet, label: "Transacciones", href: "/transactions" },
  { icon: Target, label: "Metas", href: "/goals" }, // <--- Nuevo objetivo añadido
  { icon: TrendingUp, label: "Estadísticas", href: "/analytics" },
  { icon: Sparkles, label: "Predictor IA", href: "/ml" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-card border-t-2 border-border lg:hidden" data-onboarding="bottom-nav">
      <div className="flex items-center justify-around h-full px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;

          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              data-onboarding={`nav-tab-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-14 rounded-xl transition-all duration-200 mx-1",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm scale-105" // Un toque de escala para que resalte
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "animate-pulse-slow" : "")} />
              <span className="text-[10px] mt-1 font-medium leading-tight text-center">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
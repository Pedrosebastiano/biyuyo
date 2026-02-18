import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Wallet, TrendingUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Wallet, label: "Transacciones", href: "/transactions" },
  { icon: TrendingUp, label: "Estadísticas", href: "/analytics" },
  { icon: Sparkles, label: "Predictor IA", href: "/ml" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-card border-t-2 border-border lg:hidden">
      <div className="flex items-center justify-around h-full px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;

          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-14 rounded-xl transition-colors mx-1",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] mt-1 font-medium leading-tight text-center">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
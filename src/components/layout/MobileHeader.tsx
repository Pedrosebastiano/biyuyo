import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface MobileHeaderProps {
  exchangeRate?: number;
}

export function MobileHeader({ exchangeRate = 36.50 }: MobileHeaderProps) {
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
          <AvatarImage src="/placeholder.svg" alt="User" />
          <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
            JD
          </AvatarFallback>
        </Avatar>
        <span className="font-semibold text-sm">John Doe</span>
      </div>

      {/* Exchange Rate */}
      <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg">
        <span className="text-xs text-muted-foreground">USD/VES</span>
        <span className="font-mono font-semibold text-sm text-primary">
          {exchangeRate.toFixed(2)}
        </span>
      </div>
    </header>
  );
}

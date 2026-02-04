import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  LayoutDashboard, 
  Wallet, 
  TrendingUp, 
  Users, 
  Bell, 
  Receipt,
  Target,
  Settings,
  Crown,
  LogOut
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const navigation = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/", current: true },
  { name: "Transactions", icon: Wallet, href: "/transactions", current: false },
  { name: "Analytics", icon: TrendingUp, href: "/analytics", current: false },
  { name: "Shared Accounts", icon: Users, href: "/shared", current: false, badge: "Premium" },
  { name: "Reminders", icon: Bell, href: "/reminders", current: false, badge: "3" },
  { name: "Receipts", icon: Receipt, href: "/receipts", current: false },
  { name: "Goals", icon: Target, href: "/goals", current: false },
];

const bottomNav = [
  { name: "Settings", icon: Settings, href: "/settings" },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  return (
    <div className={cn("flex flex-col h-full bg-card border-r-2 border-border", className)}>
      {/* Logo */}
      <div className="p-6 border-b-2 border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center overflow-hidden">
            {/* Reemplaza el Wallet con la imagen */}
            <img 
              src="https://pmjjguyibxydzxnofcjx.supabase.co/storage/v1/object/public/factura/biyuyo_imagen.png"
              alt="Biyuyo Logo"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Biyuyo</h1>
            <p className="text-xs text-muted-foreground">Smart Money Management</p>
          </div>
        </div>
      </div>


      {/* Navigation */}
      <ScrollArea className="flex-1 px-4 py-6">
        <nav className="space-y-2">
          {navigation.map((item) => (
            <Button
              key={item.name}
              variant={item.current ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-11",
                item.current && "shadow-sm"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="flex-1 text-left">{item.name}</span>
              {item.badge && (
                <Badge 
                  variant={item.badge === "Premium" ? "secondary" : "default"}
                  className="text-xs"
                >
                  {item.badge}
                </Badge>
              )}
            </Button>
          ))}
        </nav>
      </ScrollArea>

      {/* Premium Card */}
      <div className="p-4">
        <div className="p-4 rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-5 w-5" />
            <span className="font-semibold">Go Premium</span>
          </div>
          <p className="text-sm opacity-90 mb-3">
            Unlock shared accounts, advanced analytics & more
          </p>
          <Button variant="secondary" size="sm" className="w-full">
            Upgrade Now
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="p-4 border-t-2 border-border space-y-2">
        {bottomNav.map((item) => (
          <Button
            key={item.name}
            variant="ghost"
            className="w-full justify-start gap-3 h-11"
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </Button>
        ))}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-11 text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-5 w-5" />
          <span>Log out</span>
        </Button>
      </div>
    </div>
  );
}

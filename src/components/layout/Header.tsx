import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Bell, Search, Plus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AddTransactionDialog } from "@/components/transactions/AddTransactionDialog";
import { useTransactions } from "@/hooks/useTransactions";
import { useNavigate } from "react-router-dom";
import { differenceInDays } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useSharedProfile } from "@/contexts/SharedProfileContext";

export function Header() {
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const { user, logout } = useAuth();
  const { activeSharedProfile, setActiveProfile } = useSharedProfile();
  const { reminders } = useTransactions(
    user?.user_id || "",
    activeSharedProfile?.shared_id || null
  );
  const navigate = useNavigate();

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Count reminders that are overdue or due within 3 days (red badge ones)
  const urgentRemindersCount = reminders.filter((reminder) => {
    const daysUntilDue = differenceInDays(reminder.nextDueDate, new Date());
    return daysUntilDue <= 3; // Overdue (negative) or due within 3 days
  }).length;

  const handleNotificationClick = () => {
    navigate("/transactions?tab=reminders");
  };

  return (
    <>
      <header className="h-16 border-b-2 border-border bg-card px-6 flex items-center justify-between gap-4">
        {/* Left side - Search + Shared Profile Indicator */}
        <div className="flex items-center gap-4">
          {activeSharedProfile && (
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-lg px-3 py-1.5">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {activeSharedProfile.name}
              </span>
              <button
                onClick={() => {
                  setActiveProfile(null);
                }}
                className="text-xs text-muted-foreground hover:text-primary ml-1"
              >
                ✕
              </button>
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar transacciones..."
              className="w-64 pl-9 border-2"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <Button
            className="flex gap-2"
            onClick={() => setIsTransactionDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Agregar Transacción
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="relative border-2"
            onClick={handleNotificationClick}
          >
            <Bell className="h-5 w-5" />
            {urgentRemindersCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {urgentRemindersCount}
              </Badge>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-3 pl-2 pr-3">
                <Avatar className="h-8 w-8 border-2 border-border">
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{user?.name || "Usuario"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-2">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>Perfil</DropdownMenuItem>
              <DropdownMenuItem>Configuración</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleLogout}>Cerrar sesión</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <AddTransactionDialog
        open={isTransactionDialogOpen}
        onOpenChange={setIsTransactionDialogOpen}
      />
    </>
  );
}

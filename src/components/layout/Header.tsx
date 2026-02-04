import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Bell, Search, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AddTransactionDialog } from "@/components/transactions/AddTransactionDialog";

export function Header() {
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);

  return (
    <>
      <header className="h-16 border-b-2 border-border bg-card px-6 flex items-center justify-between gap-4">
        {/* Left side - Search */}
        <div className="flex items-center gap-4">
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

          <Button variant="outline" size="icon" className="relative border-2">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              3
            </Badge>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-3 pl-2 pr-3">
                <Avatar className="h-8 w-8 border-2 border-border">
                  <AvatarImage src="/placeholder.svg" alt="User" />
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    JD
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">John Doe</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-2">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Perfil</DropdownMenuItem>
              <DropdownMenuItem>Facturación</DropdownMenuItem>
              <DropdownMenuItem>Configuración</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">Cerrar sesión</DropdownMenuItem>
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

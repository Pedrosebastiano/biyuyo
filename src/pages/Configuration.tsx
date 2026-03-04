import React from "react";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { InstallAppButton } from "@/components/pwa/InstallAppButton"; // Asegúrate de que la ruta sea correcta
import { useAuth } from "@/contexts/AuthContext";
import { 
  Settings as SettingsIcon, 
  Bell, 
  Smartphone, 
  ChevronRight,
  Moon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

// Subcomponente para cada fila de configuración
function SettingsItem({ icon: Icon, title, subtitle, color, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-card rounded-3xl border transition-all hover:shadow-md hover:border-primary/30 active:scale-[0.98] group mb-3"
    >
      <div className="flex items-center gap-4">
        <div className={cn("p-3 rounded-2xl text-white", color)}>
          <Icon size={20} />
        </div>
        <div className="text-left">
          <h3 className="font-bold text-base">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <ChevronRight className="text-muted-foreground/50 group-hover:text-primary transition-colors" />
    </button>
  );
}

export default function Settings() {
  const { user } = useAuth(); 
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground font-medium">Inicia sesión para ver tu configuración</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Layout Base */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72">
        <Sidebar />
      </div>

      <MobileHeader />

      <div className="lg:pl-72">
        <div className="hidden lg:block">
          <Header />
        </div>

        <main className="p-4 pt-20 pb-28 lg:p-6 lg:pt-6 lg:pb-6 max-w-3xl mx-auto animate-in fade-in duration-500">
          <div className="space-y-8">
            
            {/* Cabecera de la Página */}
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <SettingsIcon className="h-8 w-8 text-primary animate-[spin_6s_linear_infinite]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-[#2d509e]">Configuración</h1>
                <p className="text-muted-foreground mt-1">Administra tu cuenta y preferencias.</p>
              </div>
            </div>

            {/* Sección de Cuenta */}
            <section className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-2">
                Mi Cuenta
              </h2>
              <div className="p-5 bg-gradient-to-br from-primary/5 to-transparent border rounded-[32px] flex items-center gap-4 mb-4">
                <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xl font-bold shadow-lg shadow-primary/30">
                  {user.email?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <h3 className="font-bold text-lg">Mi Perfil</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </section>

            {/* Sección de Preferencias */}
            <section className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-2">
                Preferencias
              </h2>
              <SettingsItem 
                icon={Moon} 
                title="Apariencia" 
                subtitle="Tema claro y oscuro" 
                color="bg-slate-700" 
                onClick={() => navigate("/appearance")} // <--- Agregas el evento onClick
              /> 
            </section>

            {/* Sección Destacada de la App (PWA) */}
            <section className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-2">
                Aplicación
              </h2>
              <div className="p-6 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border-2 border-primary/10 rounded-[32px] text-center space-y-4 relative overflow-hidden">
                {/* Decoración de fondo */}
                <Smartphone className="absolute -right-4 -bottom-4 h-32 w-32 text-primary/5 rotate-12" />
                
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-12 h-12 bg-primary/20 text-primary rounded-2xl flex items-center justify-center mb-3">
                    <Smartphone size={24} />
                  </div>
                  <h3 className="font-bold text-lg text-[#2d509e]">Lleva tus metas contigo</h3>
                  <p className="text-sm text-muted-foreground mb-5 max-w-[250px]">
                    Instala nuestra app para acceder más rápido y sin necesidad de abrir el navegador.
                  </p>
                  
                  {/* Botón de instalación independiente */}
                  <InstallAppButton />
                </div>
              </div>
            </section>

          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
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
import { useState, useEffect } from "react";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { Fingerprint, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  const { registerBiometrics, checkAvailability, loading: webAuthnLoading } = useWebAuthn();
  const [isBiometricsSupported, setIsBiometricsSupported] = useState<boolean | null>(null);

  useEffect(() => {
    checkAvailability().then(setIsBiometricsSupported);
  }, [checkAvailability]);

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
              <div className="p-5 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border border-primary/10 rounded-[32px] flex items-center gap-5 mb-4 backdrop-blur-sm relative overflow-hidden group hover:shadow-lg hover:shadow-primary/10 transition-all duration-500">
                {/* Decorative background glow */}
                <div className="absolute -left-8 -top-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/15 transition-all duration-700" />
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-accent/10 rounded-full blur-2xl group-hover:bg-accent/15 transition-all duration-700" />
                
                {/* Avatar with animated gradient ring */}
                <div className="relative shrink-0">
                  {/* Animated rotating gradient ring */}
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-primary via-accent to-primary animate-[spin_4s_linear_infinite] opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
                  {/* Inner background to create ring effect */}
                  <div className="absolute inset-0 rounded-full bg-card m-[3px]" />
                  {/* Avatar content */}
                  <div className="relative h-16 w-16 bg-gradient-to-br from-primary to-[hsl(220,56%,25%)] rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-xl shadow-primary/25 ring-2 ring-white/20 dark:ring-white/10">
                    {user.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                  {/* Online status indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-emerald-500 rounded-full border-[2.5px] border-card shadow-sm">
                    <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-40" />
                  </div>
                </div>

                {/* Profile info */}
                <div className="relative z-10 min-w-0">
                  <h3 className="font-bold text-lg tracking-tight">Mi Perfil</h3>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  <span className="inline-flex items-center gap-1.5 mt-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Cuenta activa
                  </span>
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

            {/* Sección de Seguridad */}
            {isBiometricsSupported && (
              <section className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-2">
                  Seguridad
                </h2>
                <div className="p-6 bg-card border rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-4 transition-all hover:shadow-md border-primary/10">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500 rounded-2xl text-white">
                      <Fingerprint size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-base">Acceso Biométrico</h3>
                      <p className="text-xs text-muted-foreground">Usa tu huella o reconocimiento facial</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-2xl gap-2 font-semibold border-primary/20 hover:bg-primary/5 transition-all w-full md:w-auto"
                    onClick={() => user && registerBiometrics(user.user_id)}
                    disabled={webAuthnLoading}
                  >
                    {webAuthnLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Fingerprint size={16} />
                    )}
                    {webAuthnLoading ? "Activando..." : "Activar Biometría"}
                  </Button>
                </div>
              </section>
            )}

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
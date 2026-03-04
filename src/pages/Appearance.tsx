import React, { useEffect, useState } from "react";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { 
  Sun, 
  Moon, 
  Monitor, 
  ArrowLeft,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

// Tipos de temas disponibles
const THEMES = [
  { id: "light", label: "Claro", icon: Sun, desc: "Para el día" },
  { id: "dark", label: "Oscuro", icon: Moon, desc: "Cuida tus ojos" },
  { id: "system", label: "Sistema", icon: Monitor, desc: "Se adapta a tu móvil" },
];

export default function Appearance() {
  // Inicializamos el estado leyendo el almacenamiento local, por defecto "system"
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "system";
  });

  // Este Hook es el "Motor" que cambia los colores de toda tu app
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      // Detecta si el celular del usuario está en modo oscuro
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
      localStorage.removeItem("theme"); // Si es sistema, borramos la preferencia fija
    } else {
      root.classList.add(theme);
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

  // Función genérica para volver atrás (asumiendo que uses react-router-dom o similar)
  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72">
        <Sidebar />
      </div>

      <MobileHeader />

      <div className="lg:pl-72">
        <div className="hidden lg:block">
          <Header />
        </div>

        <main className="p-4 pt-20 pb-28 lg:p-6 lg:pt-6 lg:pb-6 max-w-3xl mx-auto animate-in fade-in duration-500">
          <div className="space-y-6">
            
            {/* Cabecera con botón de volver */}
            <div className="flex items-center gap-3">
              <button 
                onClick={handleGoBack}
                className="p-2 bg-muted/50 rounded-full hover:bg-muted transition-colors active:scale-95"
              >
                <ArrowLeft className="h-6 w-6 text-foreground" />
              </button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-[#2d509e] dark:text-primary">Apariencia</h1>
                <p className="text-muted-foreground mt-1 text-sm">Personaliza cómo se ve tu aplicación.</p>
              </div>
            </div>

            {/* Selector de Tema */}
            <section className="mt-8 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-2">
                Tema de la aplicación
              </h2>
              
              <div className="grid gap-4">
                {THEMES.map((t) => {
                  const isSelected = theme === t.id;
                  
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={cn(
                        "relative flex items-center p-4 rounded-[24px] border-2 transition-all duration-300 text-left w-full group overflow-hidden",
                        isSelected 
                          ? "border-primary bg-primary/5 shadow-md shadow-primary/10" 
                          : "border-transparent bg-card hover:border-primary/30 hover:shadow-sm"
                      )}
                    >
                      {/* Icono del Tema */}
                      <div className={cn(
                        "p-3 rounded-2xl mr-4 transition-colors duration-300",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                      )}>
                        <t.icon size={24} />
                      </div>

                      {/* Textos */}
                      <div className="flex-1">
                        <h3 className={cn(
                          "font-bold text-lg transition-colors",
                          isSelected ? "text-primary" : "text-foreground"
                        )}>
                          {t.label}
                        </h3>
                        <p className="text-sm text-muted-foreground">{t.desc}</p>
                      </div>

                      {/* Indicador de Selección */}
                      {isSelected && (
                        <div className="absolute right-4 animate-in zoom-in duration-300">
                          <CheckCircle2 className="h-6 w-6 text-primary" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
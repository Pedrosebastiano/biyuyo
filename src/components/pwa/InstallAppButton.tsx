import React, { useState, useEffect, useRef } from 'react';
import { Download, Share } from 'lucide-react'; 
import { Button } from "@/components/ui/button"; // Usa tu botón estándar
import { cn } from "@/lib/utils";

export function InstallAppButton({ className }: { className?: string }) {
  const [installable, setInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const deferredPrompt = useRef<any>(null);

  // 1. Detectar dispositivo y si la app ya está instalada
  useEffect(() => {
    // Detectar iOS (iPhone, iPad, iPod o Mac con touch)
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) || 
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
            
    // Detectar si ya se está ejecutando como app independiente (instalada)
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
  }, []);

  // 2. Escuchar el evento del navegador que permite instalar
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault(); // Evita que Chrome muestre el prompt nativo de inmediato
      deferredPrompt.current = e; // Guarda el evento para usarlo al hacer clic
      setInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // 3. Función para Android / Chrome / Edge
  const handleInstallClick = async () => {
    if (!deferredPrompt.current) return;

    deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    
    console.log(`El usuario ${outcome} la instalación`);
    deferredPrompt.current = null;
    setInstallable(false);
  };

  // 4. Función para iOS (Safari no soporta el prompt automático)
  const showIOSInstructions = () => {
    alert("Para instalar la app en iOS:\n\n1. Toca el ícono de Compartir (el cuadro con la flecha hacia arriba).\n2. Desliza hacia abajo y selecciona 'Añadir a inicio' ➕.");
  };

  // Si ya está instalada (Standalone), no mostramos los botones
  if (isStandalone) return null; 

  return (
    <div className={cn("flex flex-col sm:flex-row gap-3", className)}>
      {installable && (
        <Button 
          onClick={handleInstallClick} 
          className="rounded-2xl gap-2 h-12 shadow-md shadow-primary/20 transition-all hover:scale-105"
        >
          <Download className="h-5 w-5" /> 
          Instalar App
        </Button>
      )}
      
      {/* En iOS casi nunca se dispara 'beforeinstallprompt', por lo que mostramos las instrucciones manuales */}
      {isIOS && !installable && (
        <Button 
          onClick={showIOSInstructions} 
          variant="outline"
          className="rounded-2xl gap-2 h-12 border-primary/20 hover:bg-primary/5 transition-all"
        >
          <Share className="h-5 w-5" /> 
          Instalar en iOS
        </Button>
      )}
    </div>
  );
}
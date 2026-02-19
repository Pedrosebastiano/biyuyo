import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    console.log("🔵 AuthCallback montado. Procesando URL...");

    // Supabase detecta automáticamente el hash (#access_token) en la URL
    // Solo necesitamos escuchar cuando termine de procesarlo.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`🟡 Evento Supabase: ${event}`, session);

      if (event === "SIGNED_IN" || session) {
        console.log("🟢 Usuario autenticado. Redirigiendo al Home...");
        // Pequeña pausa para asegurar que el estado global se actualice
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 100);
      } else if (event === "SIGNED_OUT") {
        console.log("🔴 Usuario salió o falló login. Redirigiendo a Login...");
        navigate("/login", { replace: true });
      }
    });

    // Cleanup: Limpiar la suscripción cuando el componente se desmonte
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner simple */}
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        <h2 className="text-xl font-semibold text-gray-700">Validando credenciales...</h2>
        <p className="text-muted-foreground text-sm">
          Por favor espera, te estamos redirigiendo.
        </p>
      </div>
    </div>
  );
}
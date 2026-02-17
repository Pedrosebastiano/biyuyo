import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

/**
 * This page handles the redirect from Google after OAuth.
 * Supabase automatically processes the URL hash/query params.
 * The onAuthStateChange listener in AuthContext will fire SIGNED_IN
 * and sync the user to your custom DB.
 */
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase processes the OAuth tokens from the URL automatically.
    // We just need to wait briefly, then the onAuthStateChange in AuthContext
    // will handle syncing the user and setting state.
    // After a short delay (to let the auth state update), redirect home.
    const timeout = setTimeout(() => {
      // Check if we ended up authenticated
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          navigate("/", { replace: true });
        } else {
          navigate("/login", { replace: true });
        }
      });
    }, 1500);

    return () => clearTimeout(timeout);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2d509e]" />
        <p className="text-muted-foreground text-sm">
          Iniciando sesión con Google...
        </p>
      </div>
    </div>
  );
}
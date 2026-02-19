import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

/**
 * Handles the redirect from Google OAuth.
 * Supabase sends tokens either as URL hash (#access_token=...) or query params.
 * This page lets Supabase process them, then redirects based on auth state.
 */
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Give Supabase time to process the OAuth tokens from the URL
    // The onAuthStateChange in AuthContext will fire SIGNED_IN and sync the user
    const handleCallback = async () => {
      try {
        // Supabase automatically parses the URL hash/params
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("[AuthCallback] Session error:", error.message);
          navigate("/login", { replace: true });
          return;
        }

        if (data.session) {
          // Session found — wait briefly for AuthContext onAuthStateChange to sync user
          setTimeout(() => {
            navigate("/", { replace: true });
          }, 1000);
        } else {
          // No session yet — wait for the auth state to settle (hash processing)
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_IN" && session) {
              subscription.unsubscribe();
              setTimeout(() => {
                navigate("/", { replace: true });
              }, 800);
            } else if (event === "SIGNED_OUT" || (!session && event !== "INITIAL_SESSION")) {
              subscription.unsubscribe();
              navigate("/login", { replace: true });
            }
          });

          // Fallback timeout
          const fallback = setTimeout(() => {
            subscription.unsubscribe();
            supabase.auth.getSession().then(({ data }) => {
              if (data.session) {
                navigate("/", { replace: true });
              } else {
                navigate("/login", { replace: true });
              }
            });
          }, 4000);

          return () => {
            clearTimeout(fallback);
            subscription.unsubscribe();
          };
        }
      } catch (err) {
        console.error("[AuthCallback] Unexpected error:", err);
        navigate("/login", { replace: true });
      }
    };

    handleCallback();
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
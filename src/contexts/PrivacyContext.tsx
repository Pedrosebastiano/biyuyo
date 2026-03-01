/**
 * PrivacyContext.tsx
 *
 * Estado global de Modo Privacidad para Biyuyo.
 *
 * Persistencia: columna `privacy_mode` (boolean) en la tabla `users` de Supabase.
 * Cada user_id tiene su propia preferencia → seguro en navegadores compartidos.
 *
 * FIXES vs versión anterior:
 *  - Eliminado el rollback automático que revertía el estado al fallar el DB.
 *  - isPrivacyMode se expone directo; el masking se hace en el JSX, no dentro
 *    de un useMemo que recreaba funciones y causaba parpadeos.
 *  - Toggle es 100% local-first: el estado NUNCA se revierte.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface PrivacyContextType {
  isPrivacyMode: boolean;
  isLoading: boolean;
  togglePrivacyMode: () => void;
}

const PrivacyContext = createContext<PrivacyContextType>({
  isPrivacyMode: false,
  isLoading: false,
  togglePrivacyMode: () => {},
});

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar preferencia desde DB cuando cambia el usuario autenticado
  useEffect(() => {
    if (!user?.user_id) {
      setIsPrivacyMode(false);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    supabase
      .from("users")
      .select("privacy_mode")
      .eq("user_id", user.user_id)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data?.privacy_mode !== undefined && data?.privacy_mode !== null) {
          setIsPrivacyMode(Boolean(data.privacy_mode));
        }
        setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [user?.user_id]);

  const togglePrivacyMode = useCallback(() => {
    setIsPrivacyMode((prev) => {
      const next = !prev;

      // Persistir al DB en segundo plano — el estado LOCAL nunca se revierte
      if (user?.user_id) {
        supabase
          .from("users")
          .update({ privacy_mode: next })
          .eq("user_id", user.user_id)
          .then(({ error }) => {
            if (error) {
              console.warn("[PrivacyMode] No se pudo guardar en DB:", error.message);
              // NO hacemos setIsPrivacyMode(prev) aquí — el estado se queda como está
            }
          });
      }

      return next;
    });
  }, [user?.user_id]);

  return (
    <PrivacyContext.Provider value={{ isPrivacyMode, isLoading, togglePrivacyMode }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  return useContext(PrivacyContext);
}
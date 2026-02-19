import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { getApiUrl } from "@/lib/config";
import { supabase } from "@/lib/supabase";

const API_URL = getApiUrl();

interface User {
  name: string;
  email: string;
  user_id: string;
  is_premium: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function syncGoogleUserToDb(
  supabaseUserId: string,
  email: string,
  name: string
): Promise<User> {
  const response = await fetch(`${API_URL}/users`);
  const allUsers: Array<{
    user_id: string;
    name: string;
    email: string;
    is_premium: boolean;
  }> = await response.json();

  const existing = allUsers.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );

  if (existing) {
    return {
      user_id: existing.user_id,
      name: existing.name,
      email: existing.email,
      is_premium: existing.is_premium || false,
    };
  }

  const randomPassword =
    Math.random().toString(36).slice(-12) +
    "Aa1!" +
    Math.random().toString(36).slice(-8);

  const signupRes = await fetch(`${API_URL}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password: randomPassword }),
  });

  if (!signupRes.ok) {
    const retryRes = await fetch(`${API_URL}/users`);
    const retryUsers: Array<{
      user_id: string;
      name: string;
      email: string;
      is_premium: boolean;
    }> = await retryRes.json();
    const retryUser = retryUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (retryUser)
      return {
        user_id: retryUser.user_id,
        name: retryUser.name,
        email: retryUser.email,
        is_premium: retryUser.is_premium || false,
      };
    throw new Error("Error al registrar usuario de Google en la base de datos");
  }

  const newUser = await signupRes.json();
  return {
    user_id: newUser.user_id,
    name: newUser.name,
    email: newUser.email,
    is_premium: newUser.is_premium || false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem("biyuyo_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const saveUser = (userData: User) => {
    localStorage.setItem("biyuyo_user", JSON.stringify(userData));
    localStorage.setItem("biyuyo_user_id", userData.user_id);
    setUser(userData);
  };

  // Refresca is_premium desde el servidor y actualiza localStorage + estado
  const refreshUser = async () => {
    try {
      const stored = localStorage.getItem("biyuyo_user");
      if (!stored) return;
      const current = JSON.parse(stored) as User;
      if (!current?.user_id) return;

      const res = await fetch(`${API_URL}/user/${current.user_id}`);
      if (!res.ok) return;
      const data = await res.json();

      saveUser({
        user_id: data.user_id,
        name: data.name,
        email: data.email,
        is_premium: data.is_premium || false,
      });
    } catch {
      // Si falla el refresh, mantiene los datos actuales
    }
  };

  useEffect(() => {
    // Restaurar sesión de localStorage (usuarios email/password)
    const stored = localStorage.getItem("biyuyo_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("biyuyo_user");
      }
    }

    // Escuchar cambios de auth de Supabase (Google OAuth)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (
        event === "SIGNED_IN" &&
        session?.user &&
        session.user.app_metadata?.provider === "google"
      ) {
        const storedUser = localStorage.getItem("biyuyo_user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (
            parsedUser.email.toLowerCase() ===
            session.user.email?.toLowerCase()
          ) {
            setUser(parsedUser);
            return;
          }
        }

        const email = session.user.email ?? "";
        const name =
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          email.split("@")[0];

        try {
          const syncedUser = await syncGoogleUserToDb(
            session.user.id,
            email,
            name
          );
          saveUser(syncedUser);
        } catch (err) {
          console.error("Error syncing Google user:", err);
        }
      }

      if (event === "SIGNED_OUT") {
        localStorage.removeItem("biyuyo_user");
        localStorage.removeItem("biyuyo_user_id");
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al iniciar sesión");
    }

    const userData = await response.json();
    saveUser({
      user_id: userData.user_id,
      name: userData.name,
      email: userData.email,
      is_premium: userData.is_premium || false,
    });
  };

  const signup = async (
    name: string,
    email: string,
    password: string
  ): Promise<User> => {
    const response = await fetch(`${API_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al crear la cuenta");
    }

    const userData = await response.json();
    const newUser: User = {
      user_id: userData.user_id,
      name: userData.name,
      email: userData.email,
      is_premium: userData.is_premium || false,
    };
    saveUser(newUser);
    return newUser;
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    if (error) throw new Error(error.message);
  };

  const logout = () => {
    supabase.auth.signOut().catch(() => { });
    localStorage.removeItem("biyuyo_user");
    localStorage.removeItem("biyuyo_user_id");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        signup,
        loginWithGoogle,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
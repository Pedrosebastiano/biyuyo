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
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// After Google OAuth, ensure the user exists in your custom `users` table
// and return the stored user row so the app has user_id etc.
async function syncGoogleUserToDb(
  supabaseUserId: string,
  email: string,
  name: string
): Promise<User> {
  // Check if user already exists in our custom users table (by email)
  const response = await fetch(`${API_URL}/users`);
  const allUsers: Array<{
    user_id: string;
    name: string;
    email: string;
  }> = await response.json();

  const existing = allUsers.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );

  if (existing) {
    return {
      user_id: existing.user_id,
      name: existing.name,
      email: existing.email,
    };
  }

  // User doesn't exist yet — create via signup endpoint (no password needed for OAuth users)
  // We generate a random secure password they'll never use
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
    // If signup fails (e.g. race condition where it was just created), try fetching again
    const retryRes = await fetch(`${API_URL}/users`);
    const retryUsers: Array<{ user_id: string; name: string; email: string }> =
      await retryRes.json();
    const retryUser = retryUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (retryUser)
      return {
        user_id: retryUser.user_id,
        name: retryUser.name,
        email: retryUser.email,
      };
    throw new Error("Error al registrar usuario de Google en la base de datos");
  }

  const newUser = await signupRes.json();
  return {
    user_id: newUser.user_id,
    name: newUser.name,
    email: newUser.email,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // On mount: load from localStorage AND listen for Supabase auth changes (Google callback)
  useEffect(() => {
    // Restore session from localStorage (for email/password users)
    const stored = localStorage.getItem("biyuyo_user");
    if (stored) {
      setUser(JSON.parse(stored));
    }

    // Listen for Supabase auth state changes (handles Google OAuth callback)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (
        event === "SIGNED_IN" &&
        session?.user &&
        session.user.app_metadata?.provider === "google"
      ) {
        // Check if we already have this user stored in localStorage
        const storedUser = localStorage.getItem("biyuyo_user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          // If same email already saved, no need to re-sync
          if (
            parsedUser.email.toLowerCase() ===
            session.user.email?.toLowerCase()
          ) {
            setUser(parsedUser);
            return;
          }
        }

        const email = session.user.email ?? "";
        // Google provides full_name in user_metadata
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
          localStorage.setItem("biyuyo_user", JSON.stringify(syncedUser));
          localStorage.setItem("biyuyo_user_id", syncedUser.user_id);
          setUser(syncedUser);
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
    localStorage.setItem("biyuyo_user", JSON.stringify(userData));
    localStorage.setItem("biyuyo_user_id", userData.user_id);
    setUser(userData);
  };

  const signup = async (name: string, email: string, password: string) => {
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
    localStorage.setItem("biyuyo_user", JSON.stringify(userData));
    localStorage.setItem("biyuyo_user_id", userData.user_id);
    setUser(userData);
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Supabase will redirect here after Google auth
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          // Request the user's profile so we can get their name
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    if (error) throw new Error(error.message);
  };

  const logout = () => {
    // Sign out from Supabase too (for Google users)
    supabase.auth.signOut().catch(() => {});
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
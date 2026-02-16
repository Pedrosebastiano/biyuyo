import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  name: string;
  email: string;
  user_id?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => void;
  signup: (name: string, email: string, password: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("biyuyo_user");
    const userId = localStorage.getItem("biyuyo_user_id");
    if (stored) {
      const userData = JSON.parse(stored);
      if (userId) {
        userData.user_id = userId;
      }
      setUser(userData);
    }
  }, []);

  const login = (email: string, _password: string) => {
    const userData: User = { 
      name: localStorage.getItem("biyuyo_user_name") || "Usuario", 
      email,
      user_id: localStorage.getItem("biyuyo_user_id") || undefined
    };
    localStorage.setItem("biyuyo_user", JSON.stringify(userData));
    setUser(userData);
  };

  const signup = (name: string, email: string, _password: string) => {
    const userId = localStorage.getItem("biyuyo_user_id");
    const userData: User = { name, email, user_id: userId || undefined };
    localStorage.setItem("biyuyo_user", JSON.stringify(userData));
    localStorage.setItem("biyuyo_user_name", name);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("biyuyo_user");
    localStorage.removeItem("biyuyo_user_id");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
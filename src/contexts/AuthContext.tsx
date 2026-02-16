import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface User {
  name: string;
  email: string;
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
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const login = (email: string, _password: string) => {
    const userData = { name: localStorage.getItem("biyuyo_user_name") || "Usuario", email };
    localStorage.setItem("biyuyo_user", JSON.stringify(userData));
    setUser(userData);
  };

  const signup = (name: string, email: string, _password: string) => {
    const userData = { name, email };
    localStorage.setItem("biyuyo_user", JSON.stringify(userData));
    localStorage.setItem("biyuyo_user_name", name);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("biyuyo_user");
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

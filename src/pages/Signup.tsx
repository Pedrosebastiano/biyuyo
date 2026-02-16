import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff, Mail, Lock, User, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import biyuyoLogo from "@/assets/biyuyo-logo.png";
import { useToast } from "@/hooks/use-toast";

const ALLOWED_DOMAINS = [
  "gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "icloud.com",
  "protonmail.com", "live.com", "msn.com", "aol.com",
  "correo.unimet.edu.ve", "unimet.edu.ve",
];

function isValidEmail(email: string) {
  const basic = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!basic) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  return ALLOWED_DOMAINS.includes(domain);
}

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const checks = useMemo(() => ({
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/;'`~]/.test(password),
  }), [password]);

  const allChecks = checks.length && checks.uppercase && checks.special;
  const emailValid = isValidEmail(email);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Error", description: "Ingresa tu nombre", variant: "destructive" });
      return;
    }
    if (!emailValid) {
      toast({ title: "Error", description: "Correo inválido o dominio no permitido", variant: "destructive" });
      return;
    }
    if (!allChecks) {
      toast({ title: "Error", description: "La contraseña no cumple los requisitos", variant: "destructive" });
      return;
    }
    signup(name, email, password);
    navigate("/");
  };

  const CheckItem = ({ ok, label }: { ok: boolean; label: string }) => (
    <div className="flex items-center gap-2 text-xs">
      {ok ? <Check className="h-3.5 w-3.5 text-green-500" /> : <X className="h-3.5 w-3.5 text-destructive" />}
      <span className={ok ? "text-green-600" : "text-destructive"}>{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-8">
      {/* Logo & Brand */}
      <div className="flex flex-col items-center mb-8">
        <img src={biyuyoLogo} alt="Biyuyo" className="h-16 w-16 rounded-2xl object-contain mb-3" />
        <h1 className="text-3xl font-bold tracking-tight text-[#2d509e]">Biyuyo</h1>
        <p className="text-muted-foreground text-sm mt-1">Crear cuenta</p>
      </div>

      {/* Signup Form */}
      <Card className="w-full max-w-sm border-2">
        <CardContent className="pt-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  className={`pl-9 ${emailTouched && email && !emailValid ? "border-destructive" : ""}`}
                />
              </div>
              {emailTouched && email && !emailValid && (
                <p className="text-xs text-destructive">Correo inválido o dominio no permitido</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Password checks */}
              <div className="space-y-1 pt-1">
                <CheckItem ok={checks.length} label="Más de 8 caracteres" />
                <CheckItem ok={checks.uppercase} label="Una letra mayúscula" />
                <CheckItem ok={checks.special} label="Un carácter especial (. , ! @ # etc.)" />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={!allChecks || !emailValid || !name.trim()}>
              Crear cuenta
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">o continuar con</span>
            </div>
          </div>

          {/* Google Button */}
          <Button variant="outline" className="w-full border-2 gap-2" type="button">
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </Button>

          {/* Login link */}
          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

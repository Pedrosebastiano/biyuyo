import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Eye, EyeOff, Mail, Lock, User,
  Check, X, Loader2, Star,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import biyuyoLogo from "@/assets/biyuyo-logo.png";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/config";

const API_URL = getApiUrl();

const ALLOWED_DOMAINS = [
  "gmail.com", "hotmail.com", "outlook.com", "yahoo.com",
  "icloud.com", "protonmail.com", "live.com", "msn.com",
  "aol.com", "correo.unimet.edu.ve", "unimet.edu.ve",
];

const UNIMET_DOMAINS = ["correo.unimet.edu.ve", "unimet.edu.ve"];

function isValidEmail(email: string) {
  const basic = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!basic) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  return ALLOWED_DOMAINS.includes(domain);
}

function isUnimetEmail(email: string) {
  const domain = email.split("@")[1]?.toLowerCase();
  return UNIMET_DOMAINS.includes(domain);
}

// ─── Verification Screen ───────────────────────────────────────────────────────
function UnimetVerificationScreen({
  userId,
  onVerified,
  onSkip,
}: {
  userId: string;
  onVerified: () => void;
  onSkip: () => void;
}) {
  const [token, setToken] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [tokenSent, setTokenSent] = useState(false);
  const { toast } = useToast();

  const handleSendToken = async () => {
    setIsSending(true);
    try {
      const res = await fetch(`${API_URL}/send-unimet-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar el código");
      if (data.dev_token) console.log("🔑 Dev token:", data.dev_token);
      setTokenSent(true);
      toast({ title: "¡Código enviado!", description: "Revisa tu correo institucional." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error al enviar el código",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async () => {
    if (!token.trim()) {
      toast({ title: "Error", description: "Ingresa el código", variant: "destructive" });
      return;
    }
    setIsVerifying(true);
    try {
      const res = await fetch(`${API_URL}/verify-unimet-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, token: token.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Token inválido");
      toast({ title: "⭐ ¡Cuenta Premium activada!", description: "Verificación exitosa." });
      onVerified();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Token inválido o expirado",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center mb-8">
        <img src={biyuyoLogo} alt="Biyuyo" className="h-16 w-16 rounded-2xl object-contain mb-3" />
        <h1 className="text-3xl font-bold tracking-tight text-[#2d509e]">Biyuyo</h1>
      </div>

      <Card className="w-full max-w-sm border-2">
        <CardContent className="pt-6 space-y-5">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Star className="h-8 w-8 text-yellow-500 fill-yellow-400" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-[#2d509e]">
              ¡Correo Unimet detectado!
            </h2>
            <p className="text-sm text-muted-foreground">
              Verifica tu correo institucional y obtén acceso{" "}
              <span className="font-semibold text-yellow-600">Premium gratis</span>.
            </p>
          </div>

          {/* Step 1 — send token */}
          {!tokenSent ? (
            <Button
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
              onClick={handleSendToken}
              disabled={isSending}
            >
              {isSending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando código...</>
              ) : (
                "Enviar código a mi correo"
              )}
            </Button>
          ) : (
            /* Step 2 — enter token */
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Ingresa el código que recibiste en tu correo Unimet.
              </p>
              <Input
                placeholder="Pega el código aquí"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="font-mono border-2"
                disabled={isVerifying}
              />
              <Button
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                onClick={handleVerify}
                disabled={isVerifying || !token.trim()}
              >
                {isVerifying ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verificando...</>
                ) : (
                  "Activar cuenta Premium"
                )}
              </Button>
              <button
                type="button"
                onClick={handleSendToken}
                disabled={isSending}
                className="w-full text-xs text-primary hover:underline"
              >
                {isSending ? "Reenviando..." : "¿No recibiste el código? Reenviar"}
              </button>
            </div>
          )}

          {/* Skip */}
          <button
            type="button"
            onClick={onSkip}
            className="w-full text-sm text-muted-foreground hover:text-foreground hover:underline pt-1"
          >
            Verificar más tarde →
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Signup Page ──────────────────────────────────────────────────────────
export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // After account created, show verification screen
  const [showVerification, setShowVerification] = useState(false);
  const [newUserId, setNewUserId] = useState<string | null>(null);

  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const checks = useMemo(() => ({
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/;'`~]/.test(password),
  }), [password]);

  const allChecks = checks.length && checks.uppercase && checks.special;
  const emailValid = isValidEmail(email);

  const handleSubmit = async (e: React.FormEvent) => {
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

    setIsSubmitting(true);
    try {
      const userData = await signup(name.trim(), email.toLowerCase().trim(), password);

      if (isUnimetEmail(email) && userData?.user_id) {
        setNewUserId(userData.user_id);
        setShowVerification(true);
      } else {
        toast({ title: "¡Cuenta creada!", description: "Tu cuenta ha sido creada exitosamente" });
        navigate("/");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear la cuenta",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al continuar con Google",
        variant: "destructive",
      });
      setIsGoogleLoading(false);
    }
  };

  // Show verification screen instead of form
  if (showVerification && newUserId) {
    return (
      <UnimetVerificationScreen
        userId={newUserId}
        onVerified={() => {
          toast({ title: "⭐ ¡Bienvenido, usuario Premium!", description: "Cuenta verificada exitosamente." });
          navigate("/");
        }}
        onSkip={() => {
          toast({
            title: "¡Cuenta creada!",
            description: "Ve a tu perfil para activar tu cuenta Premium Unimet gratis.",
          });
          navigate("/");
        }}
      />
    );
  }

  const CheckItem = ({ ok, label }: { ok: boolean; label: string }) => (
    <div className="flex items-center gap-2 text-xs">
      {ok ? <Check className="h-3.5 w-3.5 text-green-500" /> : <X className="h-3.5 w-3.5 text-destructive" />}
      <span className={ok ? "text-green-600" : "text-destructive"}>{label}</span>
    </div>
  );

  const disabled = isSubmitting || isGoogleLoading;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-8">
      <div className="flex flex-col items-center mb-8">
        <img src={biyuyoLogo} alt="Biyuyo" className="h-16 w-16 rounded-2xl object-contain mb-3" />
        <h1 className="text-3xl font-bold tracking-tight text-[#2d509e]">Biyuyo</h1>
        <p className="text-muted-foreground text-sm mt-1">Crear cuenta</p>
      </div>

      <Card className="w-full max-w-sm border-2">
        <CardContent className="pt-6 space-y-4">
          {/* Google */}
          <Button
            variant="outline"
            className="w-full border-2 gap-2 h-11"
            type="button"
            disabled={disabled}
            onClick={handleGoogleSignup}
          >
            {isGoogleLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Conectando con Google...</>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Registrarse con Google
              </>
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">o con tu correo</span>
            </div>
          </div>

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
                  disabled={disabled}
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
                  disabled={disabled}
                />
              </div>
              {emailValid && isUnimetEmail(email) && (
                <div className="flex items-center gap-1.5 text-xs text-yellow-600 font-medium">
                  <Star className="h-3.5 w-3.5 fill-yellow-400" />
                  Correo Unimet — ¡recibirás cuenta Premium!
                </div>
              )}
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
                  disabled={disabled}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={disabled}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="space-y-1 pt-1">
                <CheckItem ok={checks.length} label="Más de 8 caracteres" />
                <CheckItem ok={checks.uppercase} label="Una letra mayúscula" />
                <CheckItem ok={checks.special} label="Un carácter especial (. , ! @ # etc.)" />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!allChecks || !emailValid || !name.trim() || disabled}
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando cuenta...</>
              ) : (
                "Crear cuenta"
              )}
            </Button>
          </form>

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
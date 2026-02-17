import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, ArrowLeft, Loader2, Eye, EyeOff, Check, X } from "lucide-react";
import biyuyoLogo from "@/assets/biyuyo-logo.png";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/config";

const API_URL = getApiUrl();

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<"email" | "reset">("email");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validaciones de contraseña
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasSpecialChar = /[.!@#$%^&*()_+\-=\[\]{};':"\\|,<>\/?]/.test(newPassword);
  const allChecks = hasMinLength && hasUppercase && hasSpecialChar;

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Ingresa tu correo electrónico");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar el correo");
      }

      toast.success("¡Revisa tu correo electrónico!");
      
      // SOLO PARA DESARROLLO - Mostrar token
      if (data.dev_token) {
        console.log("🔑 Token de desarrollo:", data.dev_token);
        toast.info(`Token copiado a consola`, { duration: 5000 });
      }
      
      setStep("reset");
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Error al enviar el correo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token || !newPassword) {
      toast.error("Completa todos los campos");
      return;
    }

    if (!allChecks) {
      toast.error("La contraseña no cumple con los requisitos");
      return;
    } 

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al restablecer la contraseña");
      }

      toast.success("¡Contraseña actualizada exitosamente!");
      
      // Esperar un momento y redirigir al login
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
      
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Error al restablecer la contraseña");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center mb-10">
        <img src={biyuyoLogo} alt="Biyuyo" className="h-16 w-16 rounded-2xl object-contain mb-3" />
        <h1 className="text-3xl font-bold tracking-tight text-[#2d509e]">Biyuyo</h1>
        <p className="text-muted-foreground text-sm mt-1">Recuperar contraseña</p>
      </div>

      <Card className="w-full max-w-sm border-2">
        <CardContent className="pt-6 space-y-4">
          {step === "email" ? (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Ingresa tu correo electrónico y te enviaremos un código para restablecer tu contraseña.
              </p>
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
                    className="pl-9"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar código"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Ingresa el código que recibiste por correo y tu nueva contraseña.
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="token">Código de verificación</Label>
                <Input
                  id="token"
                  type="text"
                  placeholder="Pega el código aquí"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={isSubmitting}
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Validación visual de contraseña */}
                <div className="space-y-1.5 text-sm mt-3">
                  <div className="flex items-center gap-2">
                    {hasMinLength ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                    <span className={hasMinLength ? "text-green-600" : "text-red-500"}>
                      Más de 8 caracteres
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasUppercase ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                    <span className={hasUppercase ? "text-green-600" : "text-red-500"}>
                      Una letra mayúscula
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasSpecialChar ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                    <span className={hasSpecialChar ? "text-green-600" : "text-red-500"}>
                      Un carácter especial (. , ! @ # etc.)
                    </span>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting || !allChecks}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Restablecer contraseña"
                )}
              </Button>

              <button
                type="button"
                onClick={() => setStep("email")}
                className="w-full text-sm text-primary hover:underline"
                disabled={isSubmitting}
              >
                ← Volver a solicitar código
              </button>
            </form>
          )}

          <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio de sesión
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
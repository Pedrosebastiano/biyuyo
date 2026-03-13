import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft, LogOut, Mail, User,
  Star, Loader2, Check, CreditCard,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/config";
import { FinancialEducation } from "@/components/dashboard/FinancialEducation";

const API_URL = getApiUrl();
const UNIMET_DOMAINS = ["correo.unimet.edu.ve", "unimet.edu.ve"];

function isUnimetEmail(email: string) {
  const domain = email?.split("@")[1]?.toLowerCase();
  return UNIMET_DOMAINS.includes(domain);
}

const NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

export default function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [tokenSent, setTokenSent] = useState(false);
  const [token, setToken] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  // Al entrar al perfil, refresca datos del servidor para tener is_premium actualizado
  useEffect(() => {
    refreshUser();
  }, []);

  // Sincronizar campos de edición cuando el usuario cambia
  useEffect(() => {
    if (user && !isEditing) {
      setEditName(user.name);
      setEditEmail(user.email);
    }
  }, [user, isEditing]);

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSendToken = async () => {
    if (!user) return;
    setIsSending(true);
    try {
      const res = await fetch(`${API_URL}/send-unimet-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id }),
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
    if (!user || !token.trim()) return;
    setIsVerifying(true);
    try {
      const res = await fetch(`${API_URL}/verify-unimet-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id, token: token.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Token inválido");

      // Refresca el contexto para que is_premium quede en true en localStorage
      await refreshUser();

      toast({ title: "⭐ ¡Cuenta Premium activada!", description: "Verificación exitosa." });
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

  const handleUpdateProfile = async () => {
    if (!user) return;

    // Validaciones frontend (mismos criterios que backend)
    if (!NAME_REGEX.test(editName)) {
      toast({ title: "Error", description: "El nombre solo puede contener letras y espacios", variant: "destructive" });
      return;
    }
    if (editName.length > 30) {
      toast({ title: "Error", description: "El nombre no puede exceder los 30 caracteres", variant: "destructive" });
      return;
    }

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_REGEX.test(editEmail)) {
      toast({ title: "Error", description: "El correo electrónico no es válido", variant: "destructive" });
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`${API_URL}/user/${user.user_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, email: editEmail }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Error al actualizar perfil");

      await refreshUser();
      setIsEditing(false);
      toast({ title: "¡Perfil actualizado!", description: "Tus cambios se han guardado exitosamente." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error al actualizar perfil",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const isPremium = user?.is_premium || false;
  const showUnimetSection = user?.email && isUnimetEmail(user.email);

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-primary hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>

      <div className="max-w-sm mx-auto space-y-6">

        {/* Avatar + nombre */}
        <div className="flex flex-col items-center">
          <Avatar className="h-20 w-20 border-2 border-border mb-3">
            <AvatarFallback
              className="text-2xl font-bold"
              style={{
                background: isPremium
                  ? "linear-gradient(135deg, #b8860b, #ffd700, #b8860b)"
                  : "hsl(var(--primary))",
                color: isPremium ? "#3d2800" : "hsl(var(--primary-foreground))",
              }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Nombre en dorado si es premium */}
          <h1
            className="text-2xl font-bold"
            style={{
              color: isPremium ? "#b8860b" : "#2d509e",
            }}
          >
            {user?.name || "Usuario"}
            {isPremium && (
              <Star className="inline-block h-5 w-5 ml-2 fill-yellow-400 text-yellow-400 align-middle" />
            )}
          </h1>

          <p className="text-sm text-muted-foreground">{user?.email}</p>

          {isPremium && (
            <div className="flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: "#fef9c3", color: "#854d0e" }}>
              <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
              Cuenta Premium Verificada
            </div>
          )}
        </div>

        {/* Info card */}
        <Card className="border-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Información personal</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => isEditing ? handleUpdateProfile() : setIsEditing(true)}
              disabled={isUpdating}
              className="text-primary hover:text-primary/80"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEditing ? (
                <Check className="h-4 w-4" />
              ) : (
                "Editar"
              )}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Nombre</p>
                {isEditing ? (
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8 text-sm mt-1"
                    placeholder="Tu nombre"
                  />
                ) : (
                  <p className="text-sm font-medium">{user?.name || "—"}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Correo electrónico</p>
                {isEditing ? (
                  <Input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="h-8 text-sm mt-1"
                    placeholder="tu@correo.com"
                  />
                ) : (
                  <p className="text-sm font-medium">{user?.email || "—"}</p>
                )}
              </div>
            </div>
            {isEditing && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs h-8"
                onClick={() => setIsEditing(false)}
                disabled={isUpdating}
              >
                Cancelar
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Sección Unimet — solo si tiene correo Unimet */}
        {showUnimetSection && (
          isPremium ? (
            /* Ya es premium */
            <Card className="border-2 border-yellow-300" style={{ background: "#fefce8" }}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-100 p-2 rounded-full">
                    <Star className="h-6 w-6 fill-yellow-400 text-yellow-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-yellow-800">Cuenta Premium activa</p>
                    <p className="text-xs text-yellow-700">
                      Tu correo Unimet está verificado. ¡Disfruta todos los beneficios!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* No verificado aún */
            <Card className="border-2 border-yellow-300" style={{ background: "#fefce8" }} data-onboarding="unimet-verification-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-yellow-700">
                  <Star className="h-4 w-4 fill-yellow-400" />
                  Verificación Premium Unimet
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-yellow-800">
                  Verifica tu correo institucional y obtén acceso Premium gratis.
                </p>

                {!tokenSent ? (
                  <Button
                    className="w-full text-white"
                    style={{ background: "#eab308" }}
                    onClick={handleSendToken}
                    disabled={isSending}
                  >
                    {isSending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</>
                    ) : (
                      "Enviar código de verificación"
                    )}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Input
                      placeholder="Pega el código aquí"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      className="font-mono border-2 border-yellow-300"
                      disabled={isVerifying}
                    />
                    <Button
                      className="w-full text-white"
                      style={{ background: "#eab308" }}
                      onClick={handleVerify}
                      disabled={isVerifying || !token.trim()}
                    >
                      {isVerifying ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verificando...</>
                      ) : (
                        "Activar Premium"
                      )}
                    </Button>
                    <button
                      type="button"
                      onClick={handleSendToken}
                      disabled={isSending}
                      className="w-full text-xs text-yellow-700 hover:underline"
                    >
                      {isSending ? "Reenviando..." : "¿No recibiste el código? Reenviar"}
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        )}

        {/* Educación Financiera */}
        <FinancialEducation />

        {/* Pasarela de Pago */}
        <Button
          variant="outline"
          className="w-full gap-2 rounded-xl h-12 border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all"
          onClick={() => navigate("/payment")}
        >
          <CreditCard className="h-5 w-5 text-primary" />
          <span className="font-semibold">Pasarela de Pago</span>
        </Button>

        {/* Logout */}
        <Button variant="destructive" className="w-full gap-2" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}
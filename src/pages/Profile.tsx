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
  CalendarDays, Clock,
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

  const [showRenew, setShowRenew] = useState(false);

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

      // Trigger premium onboarding and redirect to dashboard
      if (!user?.is_premium) {
        localStorage.removeItem("biyuyo_premium_onboarding_complete");
        localStorage.setItem("biyuyo_premium_onboarding", "true");
      }
      navigate("/");

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

  // Calcular info de suscripción
  const premiumExpiresAt = user?.premium_expires_at ? new Date(user.premium_expires_at) : null;
  const premiumPlan = user?.premium_plan || null;
  const daysRemaining = premiumExpiresAt
    ? Math.max(0, Math.ceil((premiumExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;
  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7;
  const formatDate = (date: Date) => date.toLocaleDateString("es-VE", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-1 text-sm text-primary hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al inicio
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

        {/* Estado Premium Activo */}
        {isPremium && (
          <Card className="border-2 border-primary/20 shadow-sm relative overflow-hidden bg-card">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-yellow-600" />
            <CardContent className="pt-6 pb-5">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-2.5 rounded-full ring-2 ring-primary/20">
                  <Star className="h-6 w-6 fill-yellow-400 text-yellow-500" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Cuenta Premium activa</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {premiumPlan && premiumExpiresAt
                      ? `${premiumPlan} · Vence el ${formatDate(premiumExpiresAt)}`
                      : showUnimetSection
                        ? "Tu correo Unimet verificado."
                        : "Acceso a beneficios Premium"}
                  </p>
                </div>
              </div>

              {/* Info de suscripción con duración */}
              {premiumExpiresAt && daysRemaining !== null && (
                <div className="mt-5 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2.5 p-3 bg-secondary/30 rounded-xl border border-border/50">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      <span className="text-sm text-foreground">
                        <span className="text-muted-foreground text-xs block">Plan actual</span>
                        <span className="font-medium">{premiumPlan || "Premium"}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 p-3 bg-secondary/30 rounded-xl border border-border/50">
                      <Clock className={`h-4 w-4 ${isExpiringSoon ? "text-red-500" : "text-primary"}`} />
                      <span className="text-sm text-foreground">
                        <span className="text-muted-foreground text-xs block">Tiempo restante</span>
                        <span className={`font-medium ${isExpiringSoon ? "text-red-500" : ""}`}>
                          {daysRemaining} día{daysRemaining !== 1 ? "s" : ""}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  {user?.premium_started_at && (
                    (() => {
                      const startMs = new Date(user.premium_started_at).getTime();
                      const endMs = premiumExpiresAt.getTime();
                      const nowMs = Date.now();
                      const elapsed = Math.max(0, Math.min(1, (nowMs - startMs) / (endMs - startMs)));
                      return (
                        <div className="mt-2 text-right">
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isExpiringSoon ? "bg-red-500" : "bg-primary"
                              }`}
                              style={{ width: `${elapsed * 100}%` }}
                            />
                          </div>
                          <p className={`text-[10px] mt-1.5 ${isExpiringSoon ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                            {isExpiringSoon ? "⚠️ ¡Tu plan expirará pronto!" : `${Math.round(elapsed * 100)}% transcurrido`}
                          </p>
                        </div>
                      );
                    })()
                  )}
                  
                  {/* Botón de Renovar solo si quedan <= 10 días */}
                  {daysRemaining <= 10 && !showRenew && (
                    <Button 
                      className="w-full mt-3 h-9" 
                      variant="outline" 
                      onClick={() => setShowRenew(true)}
                    >
                      Renovar suscripción
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sección Unimet — solo si tiene correo Unimet y NO es Premium */}
        {showUnimetSection && !isPremium && (
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
        )}

        {/* Suscripción Premium */}
        {(!isPremium || showRenew) && (
          <Card className="border-2 border-primary/20 overflow-hidden shadow-sm mt-4">
            <div className="bg-gradient-to-r from-[#2d509e] to-[#436cd3] p-4 text-white">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                Suscribirme al plan Premium
              </h2>
              <p className="text-sm text-white/90 mt-1">
                Desbloquea todo el potencial de Biyuyo
              </p>
            </div>
            <CardContent className="p-5 space-y-4">
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span><strong className="text-foreground">Perfiles compartidos:</strong> Administra tus finanzas en familia o en pareja con cuentas vinculadas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span><strong className="text-foreground">Metas de ahorro en conjunto:</strong> Alcanza tus objetivos financieros aportando junto a tus familiares o pareja.</span>
                </li>
              </ul>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex flex-col h-auto py-3 gap-1 border-primary/30 hover:border-primary hover:bg-primary/5"
                  onClick={() => navigate("/payment", { state: { price: 4.99, planText: "Mensualidad" } })}
                >
                  <span className="font-bold text-base text-foreground">Mensualidad</span>
                  <span className="text-xs text-muted-foreground">$4.99 / mes</span>
                </Button>
                <Button
                  className="flex flex-col h-auto py-3 gap-1 bg-[#2d509e] text-white hover:bg-[#2d509e]/90 shadow-md shadow-primary/20"
                  onClick={() => navigate("/payment", { state: { price: 49.99, planText: "Plan Anual" } })}
                >
                  <span className="font-bold text-base">Plan Anual</span>
                  <span className="text-xs text-white/80">$49.99 / año</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Educación Financiera */}
        <FinancialEducation />



        {/* Logout */}
        <Button variant="destructive" className="w-full gap-2" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}
import React, { useState } from "react";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import {
  CreditCard,
  Lock,
  ShieldCheck,
  Wallet,
  Building2,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { getApiUrl } from "@/lib/config";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

type PaymentMethod = "paypal" | "pagomovil";

const paymentMethods = [
  { id: "paypal" as const, label: "PayPal", icon: Wallet, color: "bg-indigo-500" },
  { id: "pagomovil" as const, label: "Pago Móvil", icon: Smartphone, color: "bg-orange-500" },
];

export default function PaymentGateway() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const API_URL = getApiUrl();

  const state = location.state as { price?: number; planText?: string } | null;
  const totalAmount = state?.price || 1250.00;
  const conceptText = state?.planText ? `Suscripción Premium (${state.planText})` : "Suscripción Premium Biyuyo";
  const subtotalAmount = totalAmount / 1.16;
  const taxAmount = totalAmount - subtotalAmount;

  const formatCurrency = (val: number) => `$${val.toFixed(2)}`;

  const { rate, loading: loadingRate } = useExchangeRate();
  const vesAmount = rate ? (totalAmount * rate).toFixed(2) : "...";

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("paypal");
  const [pagoMovilPhone, setPagoMovilPhone] = useState("");
  const [pagoMovilCedula, setPagoMovilCedula] = useState("");
  const [pagoMovilReferencia, setPagoMovilReferencia] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const processPremiumUpgrade = async () => {
    try {
      const res = await fetch(`${API_URL}/upgrade-premium`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.user_id,
          method: selectedMethod,
          amount_usd: totalAmount,
          amount_ves: selectedMethod === "pagomovil" ? vesAmount : null,
          referencia: selectedMethod === "pagomovil" ? pagoMovilReferencia : null,
          plan: state?.planText || "Mensualidad"
        }),
      });

      if (!res.ok) throw new Error("Error activando plan premium");

      await refreshUser();

      // Activar el tutorial interactivo premium si es primera vez
      if (!user?.is_premium) {
        localStorage.removeItem("biyuyo_premium_onboarding_complete");
        localStorage.setItem("biyuyo_premium_onboarding", "true");
      }

      toast.success("¡Pago completado! Ya eres Premium ⭐");
      navigate("/");
    } catch (err) {
      toast.error("Hubo un error al procesar el pago final en nuestro sistema");
      console.error(err);
    }
  };

  const handlePay = async () => {
    if (selectedMethod === "pagomovil") {
      if (!pagoMovilPhone.trim() || !pagoMovilCedula.trim() || !pagoMovilReferencia.trim()) {
        toast.error("Por favor completa los datos y la referencia de Pago Móvil.");
        return;
      }
    }

    setIsProcessing(true);

    try {
      // Simular procesamiento del pago con la pasarela de Pago Móvil
      await new Promise((resolve) => setTimeout(resolve, 2500));
      await processPremiumUpgrade();
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground font-medium">
          Inicia sesión para acceder a la pasarela de pago
        </p>
      </div>
    );
  }

  // ─── Pantalla de éxito ────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72">
          <Sidebar />
        </div>
        <MobileHeader />
        <div className="lg:pl-72">
          <div className="hidden lg:block">
            <Header />
          </div>
          <main className="p-4 pt-20 pb-28 lg:p-6 lg:pt-6 lg:pb-6 max-w-2xl mx-auto">
            <div className="flex flex-col items-center justify-center py-16 animate-in fade-in zoom-in duration-700">
              <div className="relative mb-6">
                <div className="absolute -inset-4 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
                <div className="relative p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full text-white shadow-xl shadow-emerald-500/30">
                  <CheckCircle2 size={48} />
                </div>
              </div>

              <h1 className="text-3xl font-bold text-center mb-2">¡Pago Exitoso!</h1>
              <p className="text-muted-foreground text-center mb-2 max-w-sm">
                Tu pago ha sido procesado correctamente. Recibirás una confirmación por correo electrónico.
              </p>

              <div className="mt-6 p-5 bg-card border rounded-3xl w-full max-w-sm space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Referencia</span>
                  <span className="font-mono font-bold text-xs">TXN-{Date.now().toString(36).toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Método</span>
                  <span className="font-medium capitalize">{selectedMethod === "paypal" ? "PayPal" : "Pago Móvil"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total pagado</span>
                  <span className="font-bold text-primary">
                    {selectedMethod === "pagomovil" ? `Bs. ${vesAmount}` : formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <Button
                  variant="outline"
                  className="rounded-2xl"
                  onClick={() => navigate("/")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al Dashboard
                </Button>
                <Button
                  className="rounded-2xl"
                  onClick={() => {
                    setIsSuccess(false);
                  }}
                >
                  Nuevo Pago
                </Button>
              </div>
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ─── Formulario principal ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* Layout Base */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72">
        <Sidebar />
      </div>

      <MobileHeader />

      <div className="lg:pl-72">
        <div className="hidden lg:block">
          <Header />
        </div>

        <main className="p-4 pt-20 pb-28 lg:p-6 lg:pt-6 lg:pb-6 max-w-3xl mx-auto animate-in fade-in duration-500">
          <div className="space-y-8">

            {/* ── Cabecera de la Página ── */}
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <CreditCard className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-[#2d509e]">
                  Pasarela de Pago
                </h1>
                <p className="text-muted-foreground mt-1">
                  Completa tu pago de forma segura.
                </p>
              </div>
            </div>

            {/* ── Resumen del Pago ── */}
            <section className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-2">
                Resumen del Pago
              </h2>
              <div className="p-5 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border border-primary/10 rounded-[32px] relative overflow-hidden group hover:shadow-lg hover:shadow-primary/10 transition-all duration-500">
                {/* Glow decorativo */}
                <div className="absolute -left-8 -top-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/15 transition-all duration-700" />
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-accent/10 rounded-full blur-2xl group-hover:bg-accent/15 transition-all duration-700" />

                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/20">
                      <Sparkles size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Concepto</p>
                      <p className="font-bold text-lg">{conceptText}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-background/60 rounded-2xl border backdrop-blur-sm">
                      <p className="text-xs text-muted-foreground mb-1">Subtotal</p>
                      <p className="text-lg font-bold">{formatCurrency(subtotalAmount)}</p>
                    </div>
                    <div className="p-4 bg-background/60 rounded-2xl border backdrop-blur-sm">
                      <p className="text-xs text-muted-foreground mb-1">Impuestos</p>
                      <p className="text-lg font-bold">{formatCurrency(taxAmount)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-primary/10">
                    <span className="text-sm font-medium text-muted-foreground">Total a pagar</span>
                    <span className="text-2xl font-bold text-primary">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Selector de Método de Pago ── */}
            <section className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-2">
                Método de Pago
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {paymentMethods.map((method) => {
                  const isActive = selectedMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={cn(
                        "flex flex-col items-center gap-2.5 p-4 rounded-3xl border-2 transition-all duration-300 group",
                        isActive
                          ? "border-primary bg-primary/5 shadow-md shadow-primary/10 scale-[1.02]"
                          : "border-border bg-card hover:border-primary/30 hover:shadow-sm"
                      )}
                    >
                      <div
                        className={cn(
                          "p-3 rounded-2xl text-white transition-all duration-300",
                          isActive ? method.color : "bg-muted-foreground/20"
                        )}
                      >
                        <method.icon size={20} />
                      </div>
                      <span
                        className={cn(
                          "text-sm font-semibold transition-colors",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )}
                      >
                        {method.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>



            {/* ── PayPal ── */}
            {selectedMethod === "paypal" && (
              <section className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-2">
                  PayPal
                </h2>
                <div className="p-8 bg-card border rounded-[32px] text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                    <Wallet size={32} className="text-indigo-500" />
                  </div>
                  <h3 className="font-bold text-lg">Pagar con PayPal</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Serás redirigido a PayPal para completar el pago de forma segura con tu cuenta.
                  </p>
                </div>
              </section>
            )}



            {/* ── Pago Móvil ── */}
            {selectedMethod === "pagomovil" && (
              <section className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-2">
                  Pago Móvil
                </h2>
                <div className="p-6 bg-card border rounded-[32px] space-y-5">
                  <div className="mx-auto w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center">
                    <Smartphone size={32} className="text-orange-500" />
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="pm-phone" className="text-sm font-semibold">
                        Teléfono
                      </Label>
                      <Input
                        id="pm-phone"
                        placeholder="0412-1234567"
                        value={pagoMovilPhone}
                        onChange={(e) => setPagoMovilPhone(e.target.value)}
                        className="rounded-xl h-12 text-base font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pm-cedula" className="text-sm font-semibold">
                        Cédula de Identidad
                      </Label>
                      <Input
                        id="pm-cedula"
                        placeholder="V-12345678"
                        value={pagoMovilCedula}
                        onChange={(e) => setPagoMovilCedula(e.target.value)}
                        className="rounded-xl h-12 text-base font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pm-referencia" className="text-sm font-semibold">
                        Número de Referencia
                      </Label>
                      <Input
                        id="pm-referencia"
                        placeholder="0000 0000 0000"
                        value={pagoMovilReferencia}
                        onChange={(e) => setPagoMovilReferencia(e.target.value)}
                        className="rounded-xl h-12 text-base font-mono"
                      />
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: "Banco destino", value: "Banco Nacional" },
                        { label: "Teléfono destino", value: "0414-0001234" },
                        { label: "Cédula destino", value: "J-12345678-9" },
                        { label: "Monto a Transferir", value: loadingRate ? "Calculando..." : `Bs. ${vesAmount}` },
                        { label: "Tasa BCV", value: loadingRate ? "..." : `Bs. ${rate}` },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex justify-between items-center p-3 bg-background/60 rounded-xl border"
                        >
                          <span className="text-sm text-muted-foreground">{item.label}</span>
                          <span className="text-sm font-semibold font-mono">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ── Botones de Pagar + Seguridad ── */}
            <section className="space-y-4 pb-4">
              {selectedMethod === "paypal" ? (
                <div className="w-full relative z-0">
                  <PayPalScriptProvider options={{ clientId: "test", currency: "USD", intent: "capture" }}>
                    <PayPalButtons
                      style={{ layout: "vertical", shape: "rect", color: "gold", height: 55 }}
                      createOrder={(data, actions) => {
                        return actions.order.create({
                          intent: "CAPTURE",
                          purchase_units: [
                            {
                              description: conceptText,
                              amount: {
                                currency_code: "USD",
                                value: totalAmount.toFixed(2),
                              },
                            },
                          ],
                        });
                      }}
                      onApprove={async (data, actions) => {
                        if (!actions.order) return;
                        setIsProcessing(true);
                        try {
                          await actions.order.capture();
                          await processPremiumUpgrade();
                        } catch (err) {
                          toast.error("El pago no pudo ser procesado correctamente.");
                          console.error(err);
                        } finally {
                          setIsProcessing(false);
                        }
                      }}
                      onError={(err) => {
                        toast.error("Ocurrió un error de comunicación con PayPal.");
                        console.error(err);
                      }}
                    />
                  </PayPalScriptProvider>
                </div>
              ) : (
                <Button
                  onClick={handlePay}
                  disabled={isProcessing}
                  className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Procesando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Lock size={18} />
                      Confirmar Pago Móvil (Bs. {vesAmount})
                    </div>
                  )}
                </Button>
              )}

              {/* Indicador de seguridad */}
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <ShieldCheck size={16} className="text-emerald-500" />
                <p className="text-xs">
                  Pago seguro con cifrado SSL de 256 bits
                </p>
              </div>
            </section>

          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

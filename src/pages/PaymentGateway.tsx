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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type PaymentMethod = "card" | "paypal" | "transfer";

const paymentMethods = [
  { id: "card" as const, label: "Tarjeta", icon: CreditCard, color: "bg-blue-600" },
  { id: "paypal" as const, label: "PayPal", icon: Wallet, color: "bg-indigo-500" },
  { id: "transfer" as const, label: "Transferencia", icon: Building2, color: "bg-emerald-600" },
];

export default function PaymentGateway() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("card");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Formatear número de tarjeta con espacios cada 4 dígitos
  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  // Formatear expiración como MM/AA
  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) {
      return digits.slice(0, 2) + "/" + digits.slice(2);
    }
    return digits;
  };

  const handlePay = async () => {
    if (selectedMethod === "card") {
      if (!cardName || !cardNumber || !expiry || !cvv) {
        toast.error("Por favor completa todos los campos de la tarjeta.");
        return;
      }
      if (cardNumber.replace(/\s/g, "").length < 16) {
        toast.error("El número de tarjeta debe tener 16 dígitos.");
        return;
      }
    }

    setIsProcessing(true);

    // Simular procesamiento del pago
    await new Promise((resolve) => setTimeout(resolve, 2500));

    setIsProcessing(false);
    setIsSuccess(true);

    toast.success("¡Pago procesado exitosamente!");
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
                  <span className="font-medium capitalize">{selectedMethod === "card" ? "Tarjeta" : selectedMethod === "paypal" ? "PayPal" : "Transferencia"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total pagado</span>
                  <span className="font-bold text-primary">$1,250.00</span>
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
                    setCardName("");
                    setCardNumber("");
                    setExpiry("");
                    setCvv("");
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
                      <p className="font-bold text-lg">Suscripción Premium Biyuyo</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-background/60 rounded-2xl border backdrop-blur-sm">
                      <p className="text-xs text-muted-foreground mb-1">Subtotal</p>
                      <p className="text-lg font-bold">$1,050.00</p>
                    </div>
                    <div className="p-4 bg-background/60 rounded-2xl border backdrop-blur-sm">
                      <p className="text-xs text-muted-foreground mb-1">Impuestos</p>
                      <p className="text-lg font-bold">$200.00</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-primary/10">
                    <span className="text-sm font-medium text-muted-foreground">Total a pagar</span>
                    <span className="text-2xl font-bold text-primary">$1,250.00</span>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Selector de Método de Pago ── */}
            <section className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-2">
                Método de Pago
              </h2>
              <div className="grid grid-cols-3 gap-3">
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

            {/* ── Formulario de Tarjeta ── */}
            {selectedMethod === "card" && (
              <section className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-2">
                  Datos de la Tarjeta
                </h2>
                <div className="p-6 bg-card border rounded-[32px] space-y-5">
                  {/* Visualización de tarjeta */}
                  <div className="relative h-48 w-full max-w-sm mx-auto rounded-2xl bg-gradient-to-br from-[hsl(220,56%,37%)] via-[hsl(220,56%,30%)] to-[hsl(220,56%,20%)] p-6 text-white shadow-xl shadow-primary/25 overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

                    <div className="relative z-10 flex flex-col justify-between h-full">
                      <div className="flex justify-between items-start">
                        <div className="w-10 h-7 bg-amber-400/80 rounded-md" />
                        <CreditCard size={24} className="opacity-60" />
                      </div>
                      <div>
                        <p className="font-mono text-lg tracking-[0.2em] mb-3">
                          {cardNumber || "•••• •••• •••• ••••"}
                        </p>
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[10px] uppercase opacity-60 mb-0.5">Titular</p>
                            <p className="text-sm font-medium truncate max-w-[180px]">
                              {cardName || "NOMBRE COMPLETO"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] uppercase opacity-60 mb-0.5">Exp.</p>
                            <p className="text-sm font-mono">{expiry || "MM/AA"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Campos del formulario */}
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="card-name" className="text-sm font-semibold">
                        Nombre del Titular
                      </Label>
                      <Input
                        id="card-name"
                        placeholder="Como aparece en la tarjeta"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                        className="rounded-xl h-12 text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="card-number" className="text-sm font-semibold">
                        Número de Tarjeta
                      </Label>
                      <div className="relative">
                        <Input
                          id="card-number"
                          placeholder="1234 5678 9012 3456"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          className="rounded-xl h-12 text-base font-mono pl-12"
                          maxLength={19}
                        />
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiry" className="text-sm font-semibold">
                          Expiración
                        </Label>
                        <Input
                          id="expiry"
                          placeholder="MM/AA"
                          value={expiry}
                          onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                          className="rounded-xl h-12 text-base font-mono"
                          maxLength={5}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvv" className="text-sm font-semibold">
                          CVV
                        </Label>
                        <Input
                          id="cvv"
                          type="password"
                          placeholder="•••"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          className="rounded-xl h-12 text-base font-mono"
                          maxLength={4}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

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

            {/* ── Transferencia ── */}
            {selectedMethod === "transfer" && (
              <section className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-2">
                  Transferencia Bancaria
                </h2>
                <div className="p-6 bg-card border rounded-[32px] space-y-4">
                  <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                    <Building2 size={32} className="text-emerald-600" />
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "Banco", value: "Banco Nacional" },
                      { label: "Cuenta", value: "0012-3456-7890-1234" },
                      { label: "Beneficiario", value: "Biyuyo S.A." },
                      { label: "Referencia", value: `PAY-${Date.now().toString(36).toUpperCase().slice(0, 6)}` },
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
                  <p className="text-xs text-muted-foreground text-center">
                    Tu pago será validado en un plazo de 24 a 48 horas hábiles.
                  </p>
                </div>
              </section>
            )}

            {/* ── Botón de Pagar + Seguridad ── */}
            <section className="space-y-4 pb-4">
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
                    {selectedMethod === "transfer" ? "Confirmar Transferencia" : `Pagar $1,250.00`}
                  </div>
                )}
              </Button>

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

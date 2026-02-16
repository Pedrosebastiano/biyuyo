import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, ArrowLeft } from "lucide-react";
import biyuyoLogo from "@/assets/biyuyo-logo.png";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Error", description: "Ingresa tu correo electrónico", variant: "destructive" });
      return;
    }
    // UI only - mark as sent
    setSent(true);
    toast({ title: "Correo enviado", description: "Revisa tu bandeja de entrada para restablecer tu contraseña" });
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
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
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
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                Enviar enlace
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-3 py-4">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">¡Correo enviado!</h3>
              <p className="text-sm text-muted-foreground">
                Revisa tu bandeja de entrada en <strong>{email}</strong> para restablecer tu contraseña.
              </p>
            </div>
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

import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ShieldCheck, ShieldX } from "lucide-react";
import biyuyoLogo from "@/assets/biyuyo-logo.png";

export default function Consent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  // Read OAuth params from URL
  const clientId = searchParams.get("client_id");
  const redirectUri = searchParams.get("redirect_uri");
  const scope = searchParams.get("scope");
  const state = searchParams.get("state");
  const responseType = searchParams.get("response_type");

  // If no OAuth params, this was likely accessed directly — redirect home
  useEffect(() => {
    if (!clientId && !redirectUri && !state) {
      // Not a real OAuth flow, just redirect to home
      navigate("/", { replace: true });
    }
  }, [clientId, redirectUri, state, navigate]);

  const handleAllow = () => {
    setIsProcessing(true);

    // If there's a redirect_uri, send the user back with approval
    if (redirectUri) {
      const url = new URL(redirectUri);
      if (state) url.searchParams.set("state", state);
      url.searchParams.set("approved", "true");
      window.location.href = url.toString();
    } else {
      // Fallback: just go home
      navigate("/", { replace: true });
    }
  };

  const handleDeny = () => {
    if (redirectUri) {
      const url = new URL(redirectUri);
      if (state) url.searchParams.set("state", state);
      url.searchParams.set("error", "access_denied");
      window.location.href = url.toString();
    } else {
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center mb-8">
        <img
          src={biyuyoLogo}
          alt="Biyuyo"
          className="h-16 w-16 rounded-2xl object-contain mb-3"
        />
        <h1 className="text-3xl font-bold tracking-tight text-[#2d509e]">
          Biyuyo
        </h1>
      </div>

      <Card className="w-full max-w-sm border-2">
        <CardContent className="pt-6 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="bg-blue-50 p-3 rounded-full">
                <ShieldCheck className="h-8 w-8 text-[#2d509e]" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-[#2d509e]">
              Solicitud de Acceso
            </h2>
            <p className="text-sm text-muted-foreground">
              La aplicación{" "}
              <strong className="text-foreground">
                {clientId || "Externa"}
              </strong>{" "}
              quiere acceder a tu cuenta de Biyuyo.
            </p>
          </div>

          {scope && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Permisos solicitados:
              </p>
              <p className="text-sm">{scope}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleDeny}
              disabled={isProcessing}
            >
              <ShieldX className="h-4 w-4" />
              Denegar
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleAllow}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Permitir Acceso"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
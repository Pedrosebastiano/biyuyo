import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Download, CheckCircle2, ExternalLink } from "lucide-react";

const GUIDES = [
  {
    id: "manual_fugas",
    title: "Manual de Fugas Financieras",
    description: "Identifica y elimina esos gastos invisibles que drenan tu dinero cada mes.",
    emoji: "🔍",
    url: "https://drive.google.com/file/d/1gdzOWLTFw0iPk67ZCJC9W1PYlNfotiwO/view?usp=drive_link",
    color: "from-rose-500 to-orange-500",
    bgLight: "bg-rose-500/10",
    borderColor: "border-rose-500/20",
  },
  {
    id: "guia_inversionista",
    title: "Guía: De Ahorrador a Inversionista",
    description: "Aprende a hacer crecer tu dinero con estrategias de inversión accesibles.",
    emoji: "📈",
    url: "https://drive.google.com/file/d/1R5XnBoZP0r4CZaRKfkUKNdDsKEjOskkG/view?usp=drive_link",
    color: "from-emerald-500 to-teal-500",
    bgLight: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
  },
  {
    id: "arquitectura_financiera",
    title: "Arquitectura Financiera",
    description: "Construye una estructura sólida para organizar y proteger tus finanzas.",
    emoji: "🏗️",
    url: "https://drive.google.com/file/d/1QQzyoiAWaoGiKW_nhraBpk1yrXF751QN/view?usp=drive_link",
    color: "from-blue-500 to-indigo-500",
    bgLight: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
];

const STORAGE_KEY = "biyuyo_edu_downloads";

function getDownloaded(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setDownloaded(guideId: string) {
  const current = getDownloaded();
  current[guideId] = true;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export function FinancialEducation() {
  const [downloaded, setDownloadedState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setDownloadedState(getDownloaded());
  }, []);

  const completedCount = GUIDES.filter((g) => downloaded[g.id]).length;
  const progressPct = (completedCount / GUIDES.length) * 100;

  const handleDownload = (guide: typeof GUIDES[0]) => {
    // Mark as downloaded
    setDownloaded(guide.id);
    setDownloadedState((prev) => ({ ...prev, [guide.id]: true }));

    // Open Google Drive link in new tab
    window.open(guide.url, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="border-2 overflow-hidden">
      {/* Header with progress */}
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary text-primary-foreground">
              <BookOpen size={20} />
            </div>
            <div>
              <CardTitle className="text-lg">Educación Financiera</CardTitle>
              <p className="text-xs text-muted-foreground">Guías esenciales para tu crecimiento</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-sm font-bold text-primary">
              {completedCount}/{GUIDES.length}
            </span>
            <span className="text-[10px] text-muted-foreground">completadas</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-700 ease-out rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {GUIDES.map((guide, index) => {
          const isCompleted = downloaded[guide.id] || false;

          return (
            <div
              key={guide.id}
              className={`relative rounded-2xl border p-4 transition-all ${
                isCompleted
                  ? "bg-muted/30 border-emerald-500/30"
                  : `${guide.borderColor} hover:shadow-sm`
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Step number / check */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isCompleted
                      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400"
                      : `${guide.bgLight} text-foreground`
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className={`font-bold text-sm leading-tight ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                        {guide.emoji} {guide.title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                        {guide.description}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant={isCompleted ? "ghost" : "outline"}
                    size="sm"
                    className={`mt-2 rounded-xl text-xs h-8 gap-1.5 ${
                      isCompleted ? "text-muted-foreground" : ""
                    }`}
                    onClick={() => handleDownload(guide)}
                  >
                    {isCompleted ? (
                      <>
                        <ExternalLink size={12} />
                        Abrir de nuevo
                      </>
                    ) : (
                      <>
                        <Download size={12} />
                        Descargar PDF
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {completedCount === GUIDES.length && (
          <div className="text-center py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              🎉 ¡Felicidades! Completaste todas las guías
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-500 mt-0.5">
              Aplica lo aprendido y sigue mejorando tus finanzas.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

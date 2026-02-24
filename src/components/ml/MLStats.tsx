import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Database,
  ThumbsUp,
  ThumbsDown,
  Minus,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getApiUrl, getMLApiUrl } from "@/lib/config"; // ← agregado getMLApiUrl

const ML_API = getMLApiUrl(); // ← antes era "http://localhost:8001" hardcodeado
const API_URL = getApiUrl();

interface ModelMeta {
  model_type: string;
  trained_at: string;
  n_total_samples: number;
  metrics: {
    test_accuracy: number;
    test_f1_weighted: number;
    cv_f1_mean: number;
    cv_f1_std: number;
    n_train: number;
    n_test: number;
    feature_importance: Record<string, number>;
  };
}

interface FeedbackStats {
  good_decisions: string;
  neutral_decisions: string;
  regretted_decisions: string;
  no_feedback: string;
  total_expenses: string;
  labeled_expenses: string;
}

interface Props {
  userId: string;
}

export const MLStats: React.FC<Props> = ({ userId }) => {
  const [meta, setMeta] = useState<ModelMeta | null>(null);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [retraining, setRetraining] = useState(false);

  const fetchMeta = async () => {
    setLoadingMeta(true);
    try {
      const res = await fetch(`${ML_API}/model-info`);
      if (res.ok) setMeta(await res.json());
    } catch {
      /* microservice offline */
    } finally {
      setLoadingMeta(false);
    }
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch(`${API_URL}/expenses/feedback-stats/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchMeta();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      const res = await fetch(`${ML_API}/retrain`, { method: "POST" });
      if (res.ok) {
        await fetchMeta();
      }
    } catch {
      /* ignore */
    } finally {
      setRetraining(false);
    }
  };

  // Top 5 features sorted by importance
  const topFeatures = meta
    ? Object.entries(meta.metrics.feature_importance)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    : [];

  const total = parseInt(stats?.total_expenses ?? "0");
  const good = parseInt(stats?.good_decisions ?? "0");
  const neutral = parseInt(stats?.neutral_decisions ?? "0");
  const regret = parseInt(stats?.regretted_decisions ?? "0");
  const labeled = parseInt(stats?.labeled_expenses ?? "0");
  const progressPct = total > 0 ? Math.min((labeled / 50) * 100, 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* ── Model Info ── */}
      <Card className="border-2 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-[#2d509e] text-lg flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Estado del Modelo
          </CardTitle>
          {/*<Button
            size="sm"
            variant="outline"
            onClick={handleRetrain}
            disabled={retraining}
            className="h-8 text-xs gap-1"
          >
            {retraining
              ? <><Loader2 className="h-3 w-3 animate-spin" /> Reentrenando…</>
              : <><RefreshCw className="h-3 w-3" /> Reentrenar</>
            }
          </Button>
         */}
        </CardHeader>

        <CardContent className="space-y-4">
          {loadingMeta ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando modelo…
            </div>
          ) : !meta ? (
            <p className="text-sm text-muted-foreground">
              Microservicio offline — verifica que el servicio de IA esté
              activo.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Metric
                  label="Accuracy"
                  value={`${(meta.metrics.test_accuracy * 100).toFixed(1)}%`}
                />
                <Metric
                  label="F1 Score"
                  value={`${(meta.metrics.test_f1_weighted * 100).toFixed(1)}%`}
                />
                <Metric
                  label="CV F1 Media"
                  value={`${(meta.metrics.cv_f1_mean * 100).toFixed(1)}%`}
                />
                <Metric label="Muestras" value={String(meta.n_total_samples)} />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Top features
                </p>
                {topFeatures.map(([feat, imp]) => (
                  <div key={feat} className="flex items-center gap-2 text-xs">
                    <span className="w-44 truncate text-muted-foreground">
                      {feat}
                    </span>
                    <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-[#2d509e] rounded-full transition-all duration-500"
                        style={{
                          width: `${((imp * 100) / topFeatures[0][1]).toFixed(1)}%`,
                        }}
                      />
                    </div>
                    <span className="w-10 text-right font-mono">
                      {(imp * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                Último entrenamiento:{" "}
                <span className="font-medium">
                  {new Date(meta.trained_at).toLocaleString("es-VE")}
                </span>
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Feedback Stats ── */}
      <Card className="border-2 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-[#2d509e] text-lg flex items-center gap-2">
            <Database className="h-5 w-5" />
            Tus Datos de Entrenamiento
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {loadingStats ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando
              estadísticas…
            </div>
          ) : !stats ? (
            <p className="text-sm text-muted-foreground">
              No se pudieron cargar las estadísticas.
            </p>
          ) : (
            <>
              {/* Feedback breakdown */}
              <div className="grid grid-cols-3 gap-3">
                <FeedbackCard
                  icon={<ThumbsUp className="h-5 w-5 text-emerald-500" />}
                  label="Buenas"
                  value={good}
                  color="bg-emerald-50 border-emerald-200"
                />
                <FeedbackCard
                  icon={<Minus className="h-5 w-5 text-amber-500" />}
                  label="Neutrales"
                  value={neutral}
                  color="bg-amber-50 border-amber-200"
                />
                <FeedbackCard
                  icon={<ThumbsDown className="h-5 w-5 text-rose-500" />}
                  label="Arrepentido"
                  value={regret}
                  color="bg-rose-50 border-rose-200"
                />
              </div>

              {/* Progress toward 50 labels */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{labeled} / 50 gastos etiquetados</span>
                  <span>{progressPct.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-[#2d509e] rounded-full transition-all duration-700"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {labeled >= 50
                    ? "✅ ¡Tienes suficientes datos para reentrenar el modelo!"
                    : `Necesitas ${50 - labeled} etiquetas más para mejorar el modelo.`}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                <span>Total de gastos registrados</span>
                <Badge variant="secondary">{total}</Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ── Small helpers ──────────────────────────────────────────

const Metric: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="bg-muted/50 rounded-lg p-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-lg font-bold text-[#2d509e]">{value}</p>
  </div>
);

const FeedbackCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}> = ({ icon, label, value, color }) => (
  <div
    className={`rounded-xl border-2 p-3 flex flex-col items-center gap-1 ${color}`}
  >
    {icon}
    <span className="text-xl font-bold">{value}</span>
    <span className="text-xs text-muted-foreground text-center leading-tight">
      {label}
    </span>
  </div>
);

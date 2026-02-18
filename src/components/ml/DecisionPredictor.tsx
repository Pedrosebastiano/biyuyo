import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, AlertTriangle, CheckCircle2, MinusCircle } from "lucide-react";
import { macroCategories } from "@/data/categories";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/config";

const ML_API = "http://localhost:8001";
const API_URL = getApiUrl();

interface PredictResponse {
  prediction: number;
  prediction_label: string;
  prediction_emoji: string;
  confidence: number;
  probabilities: Record<string, number>;
  advice: string;
  model_trained_at: string;
}

interface UserContext {
  balance_at_time: number;
  monthly_income_avg: number;
  monthly_expense_avg: number;
  savings_rate: number;
  upcoming_reminders_amount: number;
  overdue_reminders_count: number;
}

interface Props {
  userId: string;
}

const RESULT_CONFIG = {
  1:    { color: "bg-emerald-50 border-emerald-200", badge: "bg-emerald-100 text-emerald-800", icon: CheckCircle2,  iconColor: "text-emerald-500", label: "Buena decisión" },
  0:    { color: "bg-amber-50 border-amber-200",     badge: "bg-amber-100 text-amber-800",    icon: MinusCircle,   iconColor: "text-amber-500",   label: "Neutral"        },
  "-1": { color: "bg-rose-50 border-rose-200",       badge: "bg-rose-100 text-rose-800",      icon: AlertTriangle, iconColor: "text-rose-500",    label: "Precaución"     },
} as const;

const NECESSITY_MAP: Record<string, number> = {
  "🏠 Vivienda y hogar": 90,
  "🧾 Alimentos y bebidas": 100,
  "🏥 Salud y bienestar": 95,
  "📚 Educación y formación": 85,
  "🚗 Transporte y movilidad": 65,
  "👶 Familia y dependientes": 85,
  "🧹 Servicios personales y profesionales": 65,
  "🏦 Finanzas y obligaciones": 70,
  "🧑‍💻 Tecnología y comunicaciones": 55,
  "👕 Ropa y accesorios": 50,
  "🏗️ Construcción y remodelación": 35,
  "🎮 Entretenimiento y ocio": 40,
  "✈️ Viajes y turismo": 20,
  "🎁 Regalos y celebraciones": 25,
  "🧾 Otros gastos controlados": 45,
};

/** Groups an array of {total_amount, created_at} rows by "YYYY-MM" and returns monthly totals */
function groupByMonth(rows: Array<{ total_amount: string; created_at: string }>) {
  const map: Record<string, number> = {};
  for (const r of rows) {
    const key = r.created_at?.substring(0, 7); // "YYYY-MM"
    if (!key) continue;
    map[key] = (map[key] ?? 0) + parseFloat(r.total_amount ?? "0");
  }
  return map;
}

/** Average of the values in a monthly map, only for the last N months relative to a reference date */
function rollingAvg(
  monthlyMap: Record<string, number>,
  referenceDate: Date,
  monthsBack = 3
): number {
  const keys: string[] = [];
  for (let i = 1; i <= monthsBack; i++) {
    const d = new Date(referenceDate);
    d.setMonth(d.getMonth() - i);
    keys.push(d.toISOString().substring(0, 7));
  }
  const values = keys.map((k) => monthlyMap[k] ?? 0).filter((v) => v > 0);
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export const DecisionPredictor: React.FC<Props> = ({ userId }) => {
  const [loading, setLoading]             = useState(false);
  const [result, setResult]               = useState<PredictResponse | null>(null);
  const [macroCategory, setMacroCategory] = useState("");
  const [amount, setAmount]               = useState("");
  const [contextLoaded, setContextLoaded] = useState(false);
  const [userCtx, setUserCtx]             = useState<UserContext | null>(null);
  const [loadingCtx, setLoadingCtx]       = useState(false);

  const fetchUserContext = async () => {
    if (!userId || contextLoaded) return;
    setLoadingCtx(true);

    try {
      // ── 1. Fetch everything in parallel ─────────────────────────────────────
      const [balRes, expRes, incRes, lastFeatRes] = await Promise.all([
        fetch(`${API_URL}/account-balance/${userId}`),
        fetch(`${API_URL}/expenses?userId=${userId}`),
        fetch(`${API_URL}/incomes?userId=${userId}`),
        // Optional: may 404 if endpoint not deployed yet — handled below
        fetch(`${API_URL}/ml/last-features/${userId}`).catch(() => null),
      ]);

      // ── 2. Real balance (same formula as Index.tsx StatCard) ─────────────────
      const balData        = await balRes.json();
      const initialBalance = parseFloat(balData.initialBalance ?? "0");

      const expList: Array<{ total_amount: string; created_at: string }> =
        expRes.ok ? await expRes.json() : [];
      const incList: Array<{ total_amount: string; created_at: string }> =
        incRes.ok ? await incRes.json() : [];

      const totalIncome  = incList.reduce((s, r) => s + parseFloat(r.total_amount ?? "0"), 0);
      const totalExpense = expList.reduce((s, r) => s + parseFloat(r.total_amount ?? "0"), 0);
      const realBalance  = initialBalance + totalIncome - totalExpense;

      // ── 3. Try last-features endpoint first ──────────────────────────────────
      let monthlyIncomeAvg  = 0;
      let monthlyExpenseAvg = 0;
      let savingsRate       = -1;
      let upcomingReminders = 0;
      let overdueCount      = 0;
      let usedMLFeatures    = false;

      if (lastFeatRes && lastFeatRes.ok) {
        const featData = await lastFeatRes.json();
        const f = featData.features;
        if (f) {
          monthlyIncomeAvg  = parseFloat(f.monthly_income_avg        ?? "0");
          monthlyExpenseAvg = parseFloat(f.monthly_expense_avg       ?? "0");
          savingsRate       = parseFloat(f.savings_rate              ?? "-1");
          upcomingReminders = parseFloat(f.upcoming_reminders_amount ?? "0");
          overdueCount      = parseInt(f.overdue_reminders_count     ?? "0", 10);
          usedMLFeatures    = monthlyIncomeAvg > 0 || monthlyExpenseAvg > 0;
        }
      }

      // ── 4. Fallback: calculate rolling averages from raw transactions ────────
      if (!usedMLFeatures) {
        const now          = new Date();
        const incByMonth   = groupByMonth(incList);
        const expByMonth   = groupByMonth(expList);

        monthlyIncomeAvg  = rollingAvg(incByMonth,  now, 3);
        monthlyExpenseAvg = rollingAvg(expByMonth,  now, 3);

        // If no transactions in the last 3 months, fall back to all-time monthly avg
        if (monthlyIncomeAvg === 0 && totalIncome > 0) {
          // Count distinct months in incomes
          const incMonths = Object.keys(incByMonth).length || 1;
          monthlyIncomeAvg = totalIncome / incMonths;
        }
        if (monthlyExpenseAvg === 0 && totalExpense > 0) {
          const expMonths = Object.keys(expByMonth).length || 1;
          monthlyExpenseAvg = totalExpense / expMonths;
        }

        // savings_rate = (income - expense) / income
        savingsRate = monthlyIncomeAvg > 0
          ? parseFloat(((monthlyIncomeAvg - monthlyExpenseAvg) / monthlyIncomeAvg).toFixed(4))
          : -1;
      }

      setUserCtx({
        balance_at_time:           realBalance,
        monthly_income_avg:        monthlyIncomeAvg,
        monthly_expense_avg:       monthlyExpenseAvg,
        savings_rate:              savingsRate,
        upcoming_reminders_amount: upcomingReminders,
        overdue_reminders_count:   overdueCount,
      });
      setContextLoaded(true);
    } catch (err) {
      console.error("[DecisionPredictor] fetchUserContext:", err);
    } finally {
      setLoadingCtx(false);
    }
  };

  const getTodayFields = () => {
    const d = new Date();
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return {
      day_of_month:         d.getDate(),
      day_of_week:          d.getDay(),
      days_to_end_of_month: daysInMonth - d.getDate(),
      is_weekend:           d.getDay() === 0 || d.getDay() === 6,
    };
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!macroCategory || !amount) {
      toast.warning("Completa los campos", {
        description: "Selecciona una categoría e ingresa el monto.",
      });
      return;
    }
    if (!contextLoaded) await fetchUserContext();

    setLoading(true);
    setResult(null);

    try {
      const ctx = userCtx ?? {
        balance_at_time: 0, monthly_income_avg: 0, monthly_expense_avg: 0,
        savings_rate: -1,   upcoming_reminders_amount: 0, overdue_reminders_count: 0,
      };

      const amountNum = parseFloat(amount);

      const payload = {
        user_id:                       userId,
        macrocategoria:                macroCategory,
        amount:                        amountNum,
        category_necessity_score:      NECESSITY_MAP[macroCategory] ?? 50,
        balance_at_time:               ctx.balance_at_time,
        amount_to_balance_ratio:       ctx.balance_at_time > 0
                                         ? parseFloat((amountNum / ctx.balance_at_time).toFixed(4))
                                         : 99.0,
        monthly_income_avg:            ctx.monthly_income_avg,
        monthly_expense_avg:           ctx.monthly_expense_avg,
        savings_rate:                  ctx.savings_rate,
        upcoming_reminders_amount:     ctx.upcoming_reminders_amount,
        overdue_reminders_count:       ctx.overdue_reminders_count,
        reminders_to_balance_ratio:    ctx.balance_at_time > 0
                                         ? parseFloat((ctx.upcoming_reminders_amount / ctx.balance_at_time).toFixed(4))
                                         : 99.0,
        times_bought_this_category:    0,
        avg_amount_this_category:      0,
        amount_vs_category_avg:        1.0,
        days_since_last_same_category: -1,
        ...getTodayFields(),
      };

      const res = await fetch(`${ML_API}/predict-decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? "Error en la predicción");
      }
      setResult(await res.json());
    } catch (err: unknown) {
      toast.error("Error en predicción", {
        description:
          err instanceof Error ? err.message : "No se pudo conectar con el servidor de IA.",
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchUserContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const cfg        = result ? RESULT_CONFIG[result.prediction as keyof typeof RESULT_CONFIG] : null;
  const ResultIcon = cfg?.icon;

  return (
    <Card className="border-2 shadow-sm">
      <CardHeader>
        <CardTitle className="text-[#2d509e] text-xl flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Predictor de Decisión
          <Badge variant="secondary" className="text-xs font-normal ml-1">
            Nuevo
          </Badge>
        </CardTitle>
        <CardDescription>
          Antes de gastar, consulta a tu IA: ¿es una buena decisión financiera ahora mismo?
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handlePredict} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoría del gasto</Label>
              <Select onValueChange={setMacroCategory} value={macroCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {macroCategories.map((m) => (
                    <SelectItem key={m.id} value={m.name}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Monto ($)</Label>
              <Input
                type="number"
                placeholder="Ej: 120"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          {loadingCtx && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Cargando contexto financiero…
            </p>
          )}

          {contextLoaded && userCtx && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-muted/50 rounded-lg text-xs">
              <div>
                <p className="text-muted-foreground">Balance actual</p>
                <p className="font-semibold">
                  ${userCtx.balance_at_time.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Ing. mensual prom.</p>
                <p className="font-semibold">
                  ${userCtx.monthly_income_avg.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Tasa de ahorro</p>
                <p className="font-semibold">
                  {userCtx.savings_rate >= 0
                    ? `${(userCtx.savings_rate * 100).toFixed(1)}%`
                    : "Sin datos"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Gasto mensual prom.</p>
                <p className="font-semibold">
                  ${userCtx.monthly_expense_avg.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
              {userCtx.overdue_reminders_count > 0 && (
                <div>
                  <p className="text-muted-foreground">Recordatorios vencidos</p>
                  <p className="font-semibold text-rose-600">{userCtx.overdue_reminders_count}</p>
                </div>
              )}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#29488e] hover:bg-[#1e356d] text-white font-bold h-11"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analizando…
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" /> ¿Es buena idea gastar esto?
              </>
            )}
          </Button>
        </form>

        {result && cfg && ResultIcon && (
          <div className={`rounded-xl border-2 p-5 space-y-4 ${cfg.color}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ResultIcon className={`h-8 w-8 ${cfg.iconColor}`} />
                <div>
                  <p className="font-bold text-lg leading-tight">
                    {result.prediction_emoji} {cfg.label}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Confianza:{" "}
                    <span className="font-semibold">
                      {(result.confidence * 100).toFixed(0)}%
                    </span>
                  </p>
                </div>
              </div>
              <Badge className={cfg.badge}>{result.prediction_label}</Badge>
            </div>

            <p className="text-sm leading-relaxed">{result.advice}</p>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Distribución de probabilidad
              </p>
              {([
                { key: "1",  label: "Buena decisión", color: "bg-emerald-400" },
                { key: "0",  label: "Neutral",         color: "bg-amber-400"   },
                { key: "-1", label: "Precaución",      color: "bg-rose-400"    },
              ] as const).map(({ key, label, color }) => {
                const prob = result.probabilities[key] ?? 0;
                return (
                  <div key={key} className="flex items-center gap-2 text-xs">
                    <span className="w-28 text-muted-foreground truncate">{label}</span>
                    <div className="flex-1 bg-white/60 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${color} transition-all duration-500`}
                        style={{ width: `${(prob * 100).toFixed(1)}%` }}
                      />
                    </div>
                    <span className="w-10 text-right font-mono font-medium">
                      {(prob * 100).toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
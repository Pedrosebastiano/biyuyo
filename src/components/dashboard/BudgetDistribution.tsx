import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getApiUrl } from "@/lib/config";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PieChart, Save, RefreshCw, TrendingUp, Hash, DollarSign } from "lucide-react";

const API_URL = getApiUrl();

interface BudgetRule {
  necesarios_pct: number;
  flexibles_pct: number;
  ahorro_pct: number;
}

interface CategoryStat {
  count: number;
  amount: number;
  pct_by_count: number;
  pct_by_amount: number;
}

interface BudgetStats {
  stats: {
    necesarios: CategoryStat;
    flexibles: CategoryStat;
    ahorro: CategoryStat;
  };
  totals: {
    totalTransactions: number;
    totalAmount: number;
  };
}

const CATEGORIES = [
  {
    key: "necesarios" as const,
    label: "Gastos Necesarios",
    emoji: "🏠",
    color: "from-blue-500 to-blue-600",
    bgLight: "bg-blue-500/10",
    textColor: "text-blue-500",
    borderColor: "border-blue-500/30",
    barColor: "bg-blue-500",
    description: "Vivienda, servicios, comida, transporte, salud",
  },
  {
    key: "flexibles" as const,
    label: "Gastos Flexibles / Deseos",
    emoji: "🎉",
    color: "from-purple-500 to-pink-500",
    bgLight: "bg-purple-500/10",
    textColor: "text-purple-500",
    borderColor: "border-purple-500/30",
    barColor: "bg-purple-500",
    description: "Entretenimiento, restaurantes, suscripciones",
  },
  {
    key: "ahorro" as const,
    label: "Ahorro e Inversión",
    emoji: "💰",
    color: "from-emerald-500 to-green-500",
    bgLight: "bg-emerald-500/10",
    textColor: "text-emerald-500",
    borderColor: "border-emerald-500/30",
    barColor: "bg-emerald-500",
    description: "Fondo de emergencia, inversiones, deudas",
  },
];

function ProgressBar({ target, actual, barColor }: { target: number; actual: number; barColor: string }) {
  const diff = actual - target;
  const isOver = diff > 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>Meta: {target}%</span>
        <span className={isOver ? "text-red-400 font-semibold" : "text-emerald-400 font-semibold"}>
          Real: {actual}%
        </span>
      </div>
      <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden relative">
        {/* Target indicator */}
        <div
          className="absolute top-0 h-full w-0.5 bg-foreground/40 z-10"
          style={{ left: `${Math.min(target, 100)}%` }}
        />
        <div
          className={`h-full ${barColor} transition-all duration-700 ease-out rounded-full ${isOver ? "opacity-80" : ""}`}
          style={{ width: `${Math.min(actual, 100)}%` }}
        />
      </div>
    </div>
  );
}

export function BudgetDistribution() {
  const { user } = useAuth();
  const [rules, setRules] = useState<BudgetRule>({ necesarios_pct: 50, flexibles_pct: 30, ahorro_pct: 20 });
  const [editRules, setEditRules] = useState<BudgetRule>({ necesarios_pct: 50, flexibles_pct: 30, ahorro_pct: 20 });
  const [stats, setStats] = useState<BudgetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const fetchData = async () => {
    if (!user?.user_id) return;
    setLoading(true);
    try {
      const [rulesRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/budget-rules/${user.user_id}`),
        fetch(`${API_URL}/budget-stats/${user.user_id}`),
      ]);

      if (rulesRes.ok) {
        const rulesData = await rulesRes.json();
        setRules(rulesData);
        setEditRules(rulesData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error fetching budget data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.user_id]);

  const handleSave = async () => {
    if (!user?.user_id) return;

    const sum = editRules.necesarios_pct + editRules.flexibles_pct + editRules.ahorro_pct;
    if (sum !== 100) {
      toast.error(`Los porcentajes deben sumar 100%. Actualmente suman ${sum}%.`);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/budget-rules/${user.user_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editRules),
      });

      if (response.ok) {
        const data = await response.json();
        setRules(data);
        setIsEditing(false);
        toast.success("¡Regla de presupuesto actualizada!");
      } else {
        const err = await response.json();
        toast.error(err.error || "Error al guardar");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const handlePctChange = (key: keyof BudgetRule, value: string) => {
    const num = parseInt(value) || 0;
    setEditRules(prev => ({ ...prev, [key]: Math.max(0, Math.min(100, num)) }));
  };

  const currentSum = editRules.necesarios_pct + editRules.flexibles_pct + editRules.ahorro_pct;

  if (loading) {
    return (
      <div className="rounded-3xl border bg-card p-6 animate-pulse">
        <div className="h-6 bg-secondary rounded w-64 mb-4" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-secondary rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/15 via-primary/5 to-transparent p-5 pb-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary text-primary-foreground">
              <PieChart size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Distribución mensual de gastos</h3>
              <p className="text-xs text-muted-foreground">Compara tu meta vs tus gastos reales</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={fetchData}
            >
              <RefreshCw size={14} />
            </Button>
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs h-8"
                onClick={() => setIsEditing(true)}
              >
                Editar %
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl text-xs h-8"
                  onClick={() => {
                    setEditRules(rules);
                    setIsEditing(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  className="rounded-xl text-xs h-8 gap-1"
                  onClick={handleSave}
                  disabled={saving || currentSum !== 100}
                >
                  <Save size={12} />
                  {saving ? "..." : "Guardar"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editing mode */}
      {isEditing && (
        <div className="p-4 border-b bg-muted/30">
          <p className="text-xs text-muted-foreground mb-3">
            Ajusta los porcentajes. Deben sumar <strong>100%</strong>.{" "}
            <span className={currentSum === 100 ? "text-emerald-500 font-bold" : "text-red-400 font-bold"}>
              Actual: {currentSum}%
            </span>
          </p>
          <div className="grid grid-cols-3 gap-3">
            {CATEGORIES.map((cat) => {
              const pctKey = `${cat.key}_pct` as keyof BudgetRule;
              return (
                <div key={cat.key} className={`rounded-xl border p-3 ${cat.borderColor} ${cat.bgLight}`}>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    {cat.emoji} {cat.label}
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={editRules[pctKey]}
                      onChange={(e) => handlePctChange(pctKey, e.target.value)}
                      className="h-9 text-center font-bold text-lg border-0 bg-background/60 rounded-lg pr-6"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Cards */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {CATEGORIES.map((cat) => {
            const pctKey = `${cat.key}_pct` as keyof BudgetRule;
            const targetPct = rules[pctKey];
            const catStats = stats?.stats[cat.key];
            const pctByCount = catStats?.pct_by_count ?? 0;
            const pctByAmount = catStats?.pct_by_amount ?? 0;

            return (
              <div
                key={cat.key}
                className={`rounded-2xl border p-4 ${cat.borderColor} transition-all hover:shadow-sm`}
              >
                {/* Category header */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{cat.emoji}</span>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm leading-tight truncate">{cat.label}</h4>
                    <p className="text-[10px] text-muted-foreground truncate">{cat.description}</p>
                  </div>
                </div>

                {/* Target percentage */}
                <div className={`text-center py-2 rounded-xl ${cat.bgLight} mb-3`}>
                  <span className={`text-2xl font-extrabold ${cat.textColor}`}>{targetPct}%</span>
                  <p className="text-[10px] text-muted-foreground font-medium">Meta de presupuesto</p>
                </div>

                {/* Real stats */}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Hash size={10} className="text-muted-foreground" />
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Porcentaje en base a número de transacciones
                      </span>
                    </div>
                    <ProgressBar target={targetPct} actual={pctByCount} barColor={cat.barColor} />
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {catStats?.count ?? 0} de {stats?.totals.totalTransactions ?? 0} transacciones
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <DollarSign size={10} className="text-muted-foreground" />
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Porcentaje en base a monto total de las transacciones
                      </span>
                    </div>
                    <ProgressBar target={targetPct} actual={pctByAmount} barColor={cat.barColor} />
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      ${(catStats?.amount ?? 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} de ${(stats?.totals.totalAmount ?? 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer summary */}
        {stats && stats.totals.totalTransactions === 0 && (
          <div className="mt-4 text-center py-4 border-2 border-dashed rounded-2xl bg-muted/5">
            <TrendingUp className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              Aún no tienes gastos con tipo de presupuesto este mes.
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Registra gastos con la Regla 50/30/20 para ver tu distribución real.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

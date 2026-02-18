import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ThumbsUp, ThumbsDown, Minus, History, Search,
  ChevronLeft, ChevronRight, Loader2
} from "lucide-react";
import { getApiUrl } from "@/lib/config";
import { toast } from "sonner";

const API_URL = getApiUrl();

interface ExpenseRow {
  id: string;          // "exp-<uuid>"
  rawId: string;       // bare uuid
  type: "expense";
  amount: number;
  macroCategory: string;
  category: string;
  business: string;
  date: string;
  userFeedback: number | null;
}

interface Props {
  userId: string;
  // Pass the already-loaded transactions from the parent to avoid extra fetch
  expenses: ExpenseRow[];
  onFeedbackSaved?: () => void;
}

const FEEDBACK_META = {
  1:  { label: "Buena decisión", icon: ThumbsUp,   bg: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-400" },
  0:  { label: "Neutral",        icon: Minus,       bg: "bg-amber-100 text-amber-700 border-amber-200",       dot: "bg-amber-400"   },
  "-1": { label: "Me arrepentí", icon: ThumbsDown,  bg: "bg-rose-100 text-rose-700 border-rose-200",          dot: "bg-rose-400"    },
} as const;

const PAGE_SIZE = 8;

export const ExpensePredictionHistory: React.FC<Props> = ({
  userId,
  expenses,
  onFeedbackSaved,
}) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [saving, setSaving] = useState<string | null>(null);
  // local override map: expenseId → feedback value (optimistic UI)
  const [localFeedback, setLocalFeedback] = useState<Record<string, number>>({});

  // Reset page when search changes
  useEffect(() => { setPage(0); }, [search]);

  const filtered = expenses.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.macroCategory.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      e.business?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const saveFeedback = useCallback(async (rawId: string, value: number) => {
    setSaving(rawId);
    try {
      const res = await fetch(`${API_URL}/expenses/${rawId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, feedback: value }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      setLocalFeedback((prev) => ({ ...prev, [rawId]: value }));
      toast.success("Feedback guardado", {
        description: FEEDBACK_META[value as keyof typeof FEEDBACK_META]?.label,
      });
      onFeedbackSaved?.();
    } catch {
      toast.error("No se pudo guardar el feedback");
    } finally {
      setSaving(null);
    }
  }, [userId, onFeedbackSaved]);

  return (
    <Card className="border-2 shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
        <CardTitle className="text-[#2d509e] text-lg flex items-center gap-2">
          <History className="h-5 w-5" />
          Historial de Gastos
          <Badge variant="secondary" className="text-xs font-normal">{expenses.length} gastos</Badge>
        </CardTitle>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 h-9 text-sm"
            placeholder="Buscar categoría, negocio…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {paginated.length === 0 ? (
          <p className="text-center text-muted-foreground py-10 text-sm">
            {search ? "No se encontraron gastos con ese filtro." : "Aún no tienes gastos registrados."}
          </p>
        ) : (
          <>
            {/* Header row */}
            <div className="hidden sm:grid grid-cols-12 text-xs font-medium text-muted-foreground uppercase tracking-wide px-3">
              <span className="col-span-3">Fecha</span>
              <span className="col-span-4">Categoría</span>
              <span className="col-span-2 text-right">Monto</span>
              <span className="col-span-3 text-center">Tu decisión</span>
            </div>

            {paginated.map((exp) => {
              const feedback = localFeedback[exp.rawId] ?? exp.userFeedback;
              const isSavingThis = saving === exp.rawId;
              const fbMeta = feedback != null
                ? FEEDBACK_META[feedback as keyof typeof FEEDBACK_META]
                : null;

              return (
                <div
                  key={exp.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-0 items-center
                             rounded-xl border border-border bg-card px-4 py-3
                             hover:bg-muted/30 transition-colors"
                >
                  {/* Date */}
                  <div className="sm:col-span-3">
                    <span className="text-xs text-muted-foreground">
                      {new Date(exp.date).toLocaleDateString("es-VE", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Category + business */}
                  <div className="sm:col-span-4 flex flex-col">
                    <span className="text-sm font-medium leading-tight line-clamp-1">
                      {exp.macroCategory}
                    </span>
                    {exp.business && (
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {exp.business}
                      </span>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="sm:col-span-2 sm:text-right">
                    <span className="text-sm font-bold text-[#2d509e]">
                      ${Number(exp.amount).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {/* Feedback buttons */}
                  <div className="sm:col-span-3 flex items-center justify-start sm:justify-center gap-1.5">
                    {isSavingThis ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : fbMeta ? (
                      /* Already has feedback — show badge + allow change */
                      <div className="flex items-center gap-1.5">
                        <Badge className={`text-xs border ${fbMeta.bg} gap-1`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${fbMeta.dot}`} />
                          {fbMeta.label}
                        </Badge>
                        {/* Small change buttons */}
                        <div className="flex gap-0.5">
                          {([1, 0, -1] as const).map((v) => {
                            if (v === feedback) return null;
                            const m = FEEDBACK_META[v];
                            const Icon = m.icon;
                            return (
                              <button
                                key={v}
                                onClick={() => saveFeedback(exp.rawId, v)}
                                className="p-1 rounded hover:bg-muted transition-colors"
                                title={m.label}
                              >
                                <Icon className="h-3 w-3 text-muted-foreground" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      /* No feedback yet — show 3 buttons */
                      <div className="flex gap-1">
                        <FeedbackBtn
                          value={1}
                          icon={ThumbsUp}
                          label="Buena"
                          activeClass="hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600"
                          onClick={() => saveFeedback(exp.rawId, 1)}
                        />
                        <FeedbackBtn
                          value={0}
                          icon={Minus}
                          label="Neutral"
                          activeClass="hover:bg-amber-50 hover:border-amber-300 hover:text-amber-600"
                          onClick={() => saveFeedback(exp.rawId, 0)}
                        />
                        <FeedbackBtn
                          value={-1}
                          icon={ThumbsDown}
                          label="Arrepentí"
                          activeClass="hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600"
                          onClick={() => saveFeedback(exp.rawId, -1)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              Página {page + 1} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm" variant="outline" className="h-8 w-8 p-0"
                onClick={() => setPage((p) => Math.max(p - 1, 0))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm" variant="outline" className="h-8 w-8 p-0"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
                disabled={page === totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ── Small helper ──────────────────────────────────────────────────────────────

const FeedbackBtn: React.FC<{
  value: number;
  icon: React.ElementType;
  label: string;
  activeClass: string;
  onClick: () => void;
}> = ({ icon: Icon, label, activeClass, onClick }) => (
  <button
    onClick={onClick}
    title={label}
    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border
                border-border text-muted-foreground transition-all duration-150
                ${activeClass}`}
  >
    <Icon className="h-3.5 w-3.5" />
    <span className="hidden sm:inline">{label}</span>
  </button>
);
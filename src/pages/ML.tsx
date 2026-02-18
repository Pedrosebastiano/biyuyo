import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useTransactions } from "@/hooks/useTransactions";
import { getMLApiUrl } from "@/lib/config";
import { toast } from "sonner";
import { BrainCircuit, Loader2, Sparkles, TrendingUp } from "lucide-react";
import { macroCategories } from "@/data/categories";

import { DecisionPredictor } from "@/components/ml/DecisionPredictor";
import { MLStats } from "@/components/ml/MLStats";
import { ExpensePredictionHistory } from "@/components/ml/ExpensePredictionHistory";

const ML = () => {
    const { user } = useAuth();
    const { transactions, refreshTransactions } = useTransactions(user?.user_id || "");

    const [isTraining, setIsTraining]   = useState(false);
    const [isPredicting, setIsPredicting] = useState(false);
    const [prediction, setPrediction]   = useState<number | null>(null);
    const [macroCategory, setMacroCategory] = useState("");
    const [income, setIncome]           = useState("");
    const [savings, setSavings]         = useState("");

    // Every time a new expense/income is added, increment this key so
    // DecisionPredictor re-fetches its context with fresh data.
    const [predictorKey, setPredictorKey] = useState(0);

    const handleTransactionSaved = () => {
        refreshTransactions();
        setPredictorKey((k) => k + 1);   // forces DecisionPredictor to reload context
    };

    const handleTrain = async () => {
        if (!user?.user_id) return;
        setIsTraining(true);
        try {
            const response = await fetch(`${getMLApiUrl()}/train/${user.user_id}`, {
                method: "POST",
            });
            const data = await response.json();
            if (response.ok) {
                toast.success("¡Modelo entrenado con éxito!", {
                    description: "Tu predictor personal ahora está actualizado con tus datos más recientes.",
                });
            } else {
                toast.error("Error al entrenar el modelo", {
                    description: data.detail || "Ocurrió un error inesperado.",
                });
            }
        } catch {
            toast.error("Error de conexión", {
                description: "No se pudo conectar con el servidor de IA.",
            });
        } finally {
            setIsTraining(false);
        }
    };

    const handlePredict = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.user_id || !macroCategory || !income || !savings) {
            toast.warning("Campos incompletos", {
                description: "Por favor llena todos los campos para obtener una predicción.",
            });
            return;
        }
        setIsPredicting(true);
        try {
            const response = await fetch(`${getMLApiUrl()}/predict`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: user.user_id,
                    macrocategoria: macroCategory,
                    ingreso_mensual: parseFloat(income),
                    ahorro_actual: parseFloat(savings),
                }),
            });
            const data = await response.json();
            if (response.ok) {
                setPrediction(data.prediccion_gasto);
                toast.success("Predicción generada");
            } else {
                toast.error("Error en la predicción", {
                    description: data.detail || "Asegúrate de haber entrenado tu modelo primero.",
                });
            }
        } catch {
            toast.error("Error de conexión", {
                description: "No se pudo conectar con el servidor de IA.",
            });
        } finally {
            setIsPredicting(false);
        }
    };

    const expenses = transactions
        .filter((t) => t.type === "expense")
        .map((t) => ({
            ...t,
            type: "expense" as const,
            rawId: t.id.replace("exp-", ""),
        }));

    if (!user) {
        return (
            <DashboardLayout>
                <div className="flex justify-center h-[60vh] pt-20 text-muted-foreground">
                    Cargando…
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-8 max-w-5xl mx-auto pb-10">

                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-[#2d509e] flex items-center gap-2">
                        <BrainCircuit className="h-8 w-8" />
                        IA Predictor
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Entrena tu modelo, simula gastos futuros y consulta si tu próximo gasto es una buena decisión.
                    </p>
                </div>

                {/* ── Sección 1: Simulador original (sin tocar) ── */}
                <section className="space-y-2">
                    <SectionLabel number={1} title="Simulador de Gastos" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="md:col-span-1 border-2 shadow-sm h-fit">
                            <CardHeader>
                                <CardTitle className="text-[#2d509e] text-xl flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Entrenamiento
                                </CardTitle>
                                <CardDescription>
                                    Sincroniza tu modelo con tus transacciones de Supabase.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-muted p-4 rounded-lg text-sm">
                                    <p className="font-medium text-[#2d509e] mb-1">¿Cómo funciona?</p>
                                    <p className="text-xs text-muted-foreground">
                                        Al entrenar, la IA analiza tus gastos históricos para aprender
                                        tus patrones de consumo personalizados.
                                    </p>
                                </div>
                                <Button
                                    onClick={handleTrain}
                                    disabled={isTraining}
                                    className="w-full bg-[#29488e] hover:bg-[#1e356d] text-white font-bold h-12"
                                >
                                    {isTraining
                                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Entrenando...</>
                                        : "Entrenar Mi IA"
                                    }
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-2 border-2 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-[#2d509e] text-xl flex items-center gap-2">
                                    <Sparkles className="h-5 w-5" />
                                    Simulador de Gastos
                                </CardTitle>
                                <CardDescription>
                                    Descubre cuánto podrías gastar en una categoría según tu situación actual.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handlePredict} className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="category">Macro Categoría</Label>
                                            <Select onValueChange={setMacroCategory} value={macroCategory}>
                                                <SelectTrigger id="category">
                                                    <SelectValue placeholder="Selecciona macro-categoría" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {macroCategories.map((macro) => (
                                                        <SelectItem key={macro.id} value={macro.name}>
                                                            {macro.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="income">Ingreso Mensual ($)</Label>
                                            <Input
                                                id="income"
                                                type="number"
                                                placeholder="Ej: 2500"
                                                value={income}
                                                onChange={(e) => setIncome(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="savings">Ahorro Actual ($)</Label>
                                            <Input
                                                id="savings"
                                                type="number"
                                                placeholder="Ej: 5000"
                                                value={savings}
                                                onChange={(e) => setSavings(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t">
                                        <Button
                                            type="submit"
                                            disabled={isPredicting}
                                            className="w-full sm:w-auto bg-[#29488e] hover:bg-[#1e356d] text-white font-bold px-8 h-12"
                                        >
                                            {isPredicting
                                                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Calculando...</>
                                                : "Generar Predicción"
                                            }
                                        </Button>
                                        {prediction !== null && (
                                            <div className="flex-1 w-full bg-[#f0f4ff] p-4 rounded-xl border border-[#c5d3f7] flex items-center justify-between">
                                                <span className="text-[#29488e] font-medium">Gasto estimado:</span>
                                                <span className="text-2xl font-bold text-[#29488e]">
                                                    ${prediction.toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* ── Sección 2: Predictor de Decisión ── */}
                <section className="space-y-2">
                    <SectionLabel number={2} title="Predictor de Decisión" />
                    {/* key prop forces a full remount (and context re-fetch) after new transaction */}
                    <DecisionPredictor key={predictorKey} userId={user.user_id} />
                </section>

                {/* ── Sección 3: Estado del modelo ── */}
                <section className="space-y-2">
                    <SectionLabel number={3} title="Estado del Modelo y Tus Datos" />
                    <MLStats userId={user.user_id} />
                </section>

                {/* ── Sección 4: Historial ── */}
                <section className="space-y-2">
                    <SectionLabel number={4} title="Historial de Gastos y Feedback" />
                    <ExpensePredictionHistory
                        userId={user.user_id}
                        expenses={expenses}
                        onFeedbackSaved={handleTransactionSaved}
                    />
                </section>

            </div>
        </DashboardLayout>
    );
};

const SectionLabel: React.FC<{ number: number; title: string }> = ({ number, title }) => (
    <div className="flex items-center gap-3">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#2d509e] text-white text-xs font-bold shrink-0">
            {number}
        </span>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <div className="flex-1 h-px bg-border" />
    </div>
);

export default ML;